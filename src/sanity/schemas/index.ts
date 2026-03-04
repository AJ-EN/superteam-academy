import type { SchemaTypeDefinition } from 'sanity';
import { courseSchema } from './course';
import { moduleSchema } from './module';
import { lessonSchema } from './lesson';

export const schemaTypes: SchemaTypeDefinition[] = [
  courseSchema,
  moduleSchema,
  lessonSchema,
];
