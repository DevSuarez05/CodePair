import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class SkillsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.skill.findMany({
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
  }

  async findOne(id: string) {
    return this.db.skill.findFirst({
      where: {
        OR: [{ id }, { slug: id.toLowerCase() }],
        isActive: true,
      },
    });
  }
}
