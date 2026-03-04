import { defineArrayMember, defineField, defineType } from 'sanity';

export const moduleSchema = defineType({
  name: 'module',
  title: 'Module',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(120),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'order',
      title: 'Module Order',
      type: 'number',
      description: 'Position within the parent course (1-based).',
      validation: (Rule) => Rule.required().min(1).integer(),
    }),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'lesson' }] })],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      order: 'order',
      lessonCount: 'lessons',
    },
    prepare({ title, order, lessonCount }) {
      const count = Array.isArray(lessonCount) ? lessonCount.length : 0;
      return {
        title,
        subtitle: `Module ${order ?? '?'} · ${count} lesson${count !== 1 ? 's' : ''}`,
      };
    },
  },
});
