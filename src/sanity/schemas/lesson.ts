import { defineArrayMember, defineField, defineType } from 'sanity';

/** Reused across portable-text code blocks and the standalone challenge fields. */
const CODE_LANGUAGE_LIST = [
  { title: 'Rust', value: 'rust' },
  { title: 'TypeScript', value: 'typescript' },
  { title: 'JavaScript', value: 'javascript' },
  { title: 'Shell', value: 'shell' },
  { title: 'TOML', value: 'toml' },
];

export const lessonSchema = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'challenge', title: 'Challenge' },
    { name: 'meta', title: 'Metadata' },
  ],
  fields: [
    // ── Core ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'meta',
      validation: (Rule) => Rule.required().min(2).max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'meta',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Lesson Type',
      type: 'string',
      group: 'meta',
      options: {
        list: [
          { title: '📖 Content', value: 'content' },
          { title: '⚡ Challenge', value: 'challenge' },
        ],
        layout: 'radio',
      },
      initialValue: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      group: 'meta',
      initialValue: 25,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      group: 'meta',
      description: 'Position within the parent module (1-based).',
      validation: (Rule) => Rule.min(1).integer(),
    }),
    defineField({
      name: 'estimatedMinutes',
      title: 'Estimated Minutes',
      type: 'number',
      group: 'meta',
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'language',
      title: 'Content Language',
      type: 'string',
      group: 'meta',
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Portuguese (BR)', value: 'pt-BR' },
          { title: 'Spanish', value: 'es' },
        ],
      },
      initialValue: 'en',
    }),

    // ── Portable text content ─────────────────────────────────────────────────
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      group: 'content',
      of: [
        // Standard rich text blocks
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Code', value: 'code' },
            ],
          },
        }),
        // Inline images
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alt Text' }),
            defineField({ name: 'caption', type: 'string', title: 'Caption' }),
          ],
        }),
        // Fenced code blocks (rendered by the Monaco/Shiki component)
        defineArrayMember({
          name: 'codeBlock',
          title: 'Code Block',
          type: 'object',
          preview: {
            select: { language: 'language', filename: 'filename' },
            prepare({ language, filename }) {
              return { title: filename ?? `${language ?? 'code'} snippet` };
            },
          },
          fields: [
            defineField({
              name: 'code',
              title: 'Code',
              type: 'text',
              rows: 12,
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'language',
              title: 'Language',
              type: 'string',
              options: { list: CODE_LANGUAGE_LIST },
              initialValue: 'typescript',
            }),
            defineField({
              name: 'filename',
              title: 'Filename (optional)',
              type: 'string',
              description: 'e.g. "src/main.rs" — displayed above the code block.',
            }),
            defineField({
              name: 'highlightLines',
              title: 'Highlight Lines',
              type: 'string',
              description: 'Comma-separated line ranges to highlight, e.g. "3,7-9".',
            }),
          ],
        }),
        // Callout / info box
        defineArrayMember({
          name: 'callout',
          title: 'Callout',
          type: 'object',
          fields: [
            defineField({
              name: 'tone',
              title: 'Tone',
              type: 'string',
              options: {
                list: [
                  { title: 'ℹ️ Info', value: 'info' },
                  { title: '⚠️ Warning', value: 'warning' },
                  { title: '✅ Success', value: 'success' },
                  { title: '💡 Tip', value: 'tip' },
                ],
              },
              initialValue: 'info',
            }),
            defineField({ name: 'text', title: 'Text', type: 'text' }),
          ],
          preview: {
            select: { tone: 'tone', text: 'text' },
            prepare({ tone, text }) {
              return { title: text, subtitle: tone };
            },
          },
        }),
      ],
    }),

    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      group: 'content',
      description: 'YouTube or Loom embed URL (optional).',
    }),

    // ── Challenge-only fields ─────────────────────────────────────────────────
    defineField({
      name: 'starterCode',
      title: 'Starter Code',
      type: 'text',
      group: 'challenge',
      rows: 20,
      description: 'Code scaffold shown to the learner in the editor.',
      hidden: ({ document }) => document?.type !== 'challenge',
    }),
    defineField({
      name: 'codeLanguage',
      title: 'Code Language',
      type: 'string',
      group: 'challenge',
      options: { list: CODE_LANGUAGE_LIST.filter((l) => l.value !== 'shell' && l.value !== 'toml') },
      initialValue: 'typescript',
      hidden: ({ document }) => document?.type !== 'challenge',
    }),
    defineField({
      name: 'solutionCode',
      title: 'Solution Code',
      type: 'text',
      group: 'challenge',
      rows: 20,
      description: 'Full working solution — never shown to learners, used for test validation.',
      hidden: ({ document }) => document?.type !== 'challenge',
    }),
    defineField({
      name: 'expectedPatterns',
      title: 'Expected Patterns',
      type: 'array',
      group: 'challenge',
      description: 'Strings or regex patterns that must appear in the learner\'s submission.',
      of: [defineArrayMember({ type: 'string' })],
      hidden: ({ document }) => document?.type !== 'challenge',
    }),
    defineField({
      name: 'hints',
      title: 'Hints',
      type: 'array',
      group: 'challenge',
      description: 'Progressive hints revealed one at a time (costs 5 XP each).',
      of: [defineArrayMember({ type: 'string' })],
      hidden: ({ document }) => document?.type !== 'challenge',
    }),
    defineField({
      name: 'testCases',
      title: 'Test Cases',
      type: 'array',
      group: 'challenge',
      hidden: ({ document }) => document?.type !== 'challenge',
      of: [
        defineArrayMember({
          name: 'testCase',
          title: 'Test Case',
          type: 'object',
          preview: {
            select: { title: 'description' },
          },
          fields: [
            defineField({
              name: 'description',
              title: 'Description',
              type: 'string',
              description: 'e.g. "Transaction is signed and sent successfully"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'expectedOutput',
              title: 'Expected Output / Pattern',
              type: 'string',
              description:
                'String that should appear in console output, or "tx:success" for a confirmed transaction.',
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      type: 'type',
      order: 'order',
      xp: 'xpReward',
    },
    prepare({ title, type, order, xp }) {
      const icon = type === 'challenge' ? '⚡' : '📖';
      return {
        title: `${icon} ${title}`,
        subtitle: `Lesson ${order ?? '?'} · ${xp ?? 25} XP`,
      };
    },
  },
});
