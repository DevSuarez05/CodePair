import { Test, TestingModule } from '@nestjs/testing';
import { FeedbacksService } from './feedbacks.service';
import { DatabaseService } from '../../database/database.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('FeedbacksService', () => {
  let service: FeedbacksService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      session: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      feedback: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      helpRequest: {
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((callback) => callback(mockDb)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbacksService,
        {
          provide: DatabaseService,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<FeedbacksService>(FeedbacksService);
  });

  it('should throw NotFoundException if session does not exist', async () => {
    mockDb.session.findUnique.mockResolvedValue(null);
    await expect(
      service.create('s-none', 'u-1', { revieweeId: 'u-2', rating: 5, wouldRecommend: true }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if reviewer is not in session', async () => {
    mockDb.session.findUnique.mockResolvedValue({
      id: 's-1',
      hostId: 'host-1',
      participantId: 'part-1',
      status: 'ACTIVE',
      feedbacks: [],
    });

    await expect(
      service.create('s-1', 'intruder-id', { revieweeId: 'part-1', rating: 5, wouldRecommend: true }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException if trying to review a cancelled session', async () => {
    mockDb.session.findUnique.mockResolvedValue({
      id: 's-1',
      hostId: 'host-1',
      participantId: 'part-1',
      status: 'CANCELLED',
      feedbacks: [],
    });

    await expect(
      service.create('s-1', 'host-1', { revieweeId: 'part-1', rating: 5, wouldRecommend: true }),
    ).rejects.toThrow(BadRequestException);
  });
});
