import { Test, TestingModule } from '@nestjs/testing';
import { SkillsService } from './skills.service';
import { DatabaseService } from '../../database/database.service';

describe('SkillsService', () => {
  let service: SkillsService;
  let mockDb: {
    skill: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    mockDb = {
      skill: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '1',
            name: 'TypeScript',
            slug: 'typescript',
            category: 'Language',
            description: 'Typed JavaScript at Any Scale',
            iconUrl: null,
          },
        ]),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.OR[0].id === '1' || where.OR[1].slug === 'typescript') {
            return Promise.resolve({
              id: '1',
              name: 'TypeScript',
              slug: 'typescript',
              category: 'Language',
              isActive: true,
            });
          }
          return Promise.resolve(null);
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        {
          provide: DatabaseService,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return active skills sorted by category and name', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('typescript');
      expect(mockDb.skill.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          description: true,
          iconUrl: true,
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
    });
  });

  describe('findOne', () => {
    it('should find a skill by id or slug', async () => {
      const result = await service.findOne('typescript');
      expect(result).toBeDefined();
      expect(result?.name).toBe('TypeScript');
    });

    it('should return null when skill is not found', async () => {
      const result = await service.findOne('non-existent');
      expect(result).toBeNull();
    });
  });
});
