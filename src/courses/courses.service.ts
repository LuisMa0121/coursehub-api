import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';

type Course = {
  id: number;
  title: string;
  level: string;
};

@Injectable()
export class CoursesService {
  private courses: Course[] = [
    { id: 1, title: 'NestJS Fundamentals', level: 'beginner' },
    { id: 2, title: 'REST APIs with NestJS', level: 'beginner' },
    { id: 3, title: 'NestJS Architecture', level: 'intermediate' },
  ];

  private nextId = Math.max(0, ...this.courses.map((course) => course.id)) + 1;

  findAll(level?: string): Course[] {
    if (!level) {
      return this.courses;
    }

    return this.courses.filter((course) => course.level === level);
  }

  findOne(id: string): Course {
    const course = this.courses.find((item) => item.id === Number(id));

    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }

    return course;
  }

  create(createCourseDto: CreateCourseDto): Course {
    const course: Course = { id: this.nextId++, ...createCourseDto };
    this.courses.push(course);
    return course;
  }

  update(id: string, updateCourseDto: UpdateCourseDto): Course {
    const course = this.findOne(id);
    Object.assign(course, updateCourseDto);
    return course;
  }

  remove(id: string): Course {
    const course = this.findOne(id);
    const index = this.courses.indexOf(course);
    this.courses.splice(index, 1);
    return course;
  }
}
