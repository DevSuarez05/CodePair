import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string) {
    const user = await this.db.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true, email: true, username: true, displayName: true,
        avatarUrl: true, bio: true, githubUrl: true, linkedinUrl: true,
        role: true, status: true, preferredLanguage: true, timezone: true,
        isEmailVerified: true, lastLoginAt: true, createdAt: true,
        userSkills: {
          select: {
            proficiency: true, yearsOfExperience: true, canMentor: true,
            skill: { select: { id: true, name: true, slug: true, category: true } },
          },
        },
        _count: { select: { helpRequests: true, hostedSessions: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async getRatingSummary(userId: string) {
    const [user, feedbacks] = await Promise.all([
      this.db.user.findUnique({ where: { id: userId }, select: { id: true } }),
      this.db.feedback.findMany({
        where: { revieweeId: userId },
        select: {
          rating: true, ratingCommunication: true,
          ratingKnowledge: true, ratingPunctuality: true,
          wouldRecommend: true,
        },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found.');
    if (feedbacks.length === 0) {
      return {
        userId, totalFeedbacks: 0,
        averageRating: null, averageCommunication: null,
        averageKnowledge: null, averagePunctuality: null,
        wouldRecommendPercentage: null,
      };
    }

    const avg = (arr: (number | null)[]) => {
      const valid = arr.filter((v): v is number => v !== null);
      return valid.length ? +(valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2) : null;
    };

    return {
      userId,
      totalFeedbacks: feedbacks.length,
      averageRating:         avg(feedbacks.map((f) => f.rating)),
      averageCommunication:  avg(feedbacks.map((f) => f.ratingCommunication)),
      averageKnowledge:      avg(feedbacks.map((f) => f.ratingKnowledge)),
      averagePunctuality:    avg(feedbacks.map((f) => f.ratingPunctuality)),
      wouldRecommendPercentage: +(
        (feedbacks.filter((f) => f.wouldRecommend).length / feedbacks.length) * 100
      ).toFixed(1),
    };
  }
}
