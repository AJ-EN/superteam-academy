import { defineArrayMember, defineField, defineType } from 'sanity';

export const courseSchema = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(3).max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number',
      description: 'Total estimated time to complete the course.',
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      description: 'XP awarded for completing the entire course (in addition to per-lesson XP).',
      initialValue: 500,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'track',
      title: 'Track',
      type: 'string',
      options: {
        list: [
          { title: 'Fundamentals', value: 'fundamentals' },
          { title: 'DeFi', value: 'defi' },
          { title: 'Security', value: 'security' },
          { title: 'Full-Stack', value: 'full-stack' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'module' }] })],
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      description: 'Courses learners should complete before this one.',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'course' }] })],
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      description: 'Only published courses appear in the catalogue.',
      initialValue: false,
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Portuguese (BR)', value: 'pt-BR' },
          { title: 'Spanish', value: 'es' },
        ],
      },
      initialValue: 'en',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first in the catalogue.',
      initialValue: 100,
    }),
  ],
  orderings: [
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Title A→Z', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
  ],
  preview: {
    select: {
      title: 'title',
      track: 'track',
      media: 'thumbnail',
      published: 'isPublished',
    },
    prepare({ title, track, media, published }) {
      return {
        title,
        subtitle: `${published ? '✅' : '🚫'} ${track ?? 'No track'}`,
        media,
      };
    },
  },
});
