// Integration-level tests for intake flow validation logic.
// AI and Firestore are mocked — these test the schema + routing logic.

import { IntakePayloadSchema } from '../src/types/schemas';

describe('Intake payload validation', () => {
  describe('New customer paste intake', () => {
    it('accepts a typical allergy-containing message', () => {
      const result = IntakePayloadSchema.safeParse({
        rawText: 'Hi! I need a custom cake for my son\'s 5th birthday on August 12th. He has a severe nut allergy and we\'d like chocolate cake with buttercream frosting. About 20 guests.',
        channel: 'paste',
        customerName: 'Emily Rodriguez',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.channel).toBe('paste');
        expect(result.data.customerName).toBe('Emily Rodriguez');
        expect(result.data.attachmentUrls).toBeUndefined();
      }
    });

    it('accepts a message with attachment URLs', () => {
      const result = IntakePayloadSchema.safeParse({
        rawText: 'Here\'s my inspiration photo',
        channel: 'paste',
        attachmentUrls: [
          'https://firebasestorage.googleapis.com/v0/b/sprout-app.appspot.com/o/image1.jpg',
          'https://firebasestorage.googleapis.com/v0/b/sprout-app.appspot.com/o/image2.jpg',
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attachmentUrls?.length).toBe(2);
      }
    });

    it('accepts web_intake channel (from the smart intake link)', () => {
      const result = IntakePayloadSchema.safeParse({
        rawText: 'I found you on Instagram! I need a gluten-free wedding cake for 150 people.',
        channel: 'web_intake',
        customerName: 'Maria Chen',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Existing customer paste intake', () => {
    it('accepts with customerId instead of name', () => {
      const result = IntakePayloadSchema.safeParse({
        rawText: 'Actually, can we change the date to September 5th instead?',
        channel: 'paste',
        customerId: 'customer_abc123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts with both customerId and name (redundant but valid)', () => {
      const result = IntakePayloadSchema.safeParse({
        rawText: 'Follow up about my order',
        channel: 'paste',
        customerId: 'customer_abc123',
        customerName: 'Jane',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('handles minimum valid message (1 char)', () => {
      expect(IntakePayloadSchema.safeParse({ rawText: '?', channel: 'paste' }).success).toBe(true);
    });

    it('handles exactly 10000 char message', () => {
      expect(IntakePayloadSchema.safeParse({ rawText: 'x'.repeat(10000), channel: 'paste' }).success).toBe(true);
    });

    it('handles messages with special characters', () => {
      const result = IntakePayloadSchema.safeParse({
        rawText: 'Hi 👋 I want a cake with "roses & butterflies" — it\'s for my mom\'s 60th! <3',
        channel: 'paste',
      });
      expect(result.success).toBe(true);
    });

    it('handles unicode in customer name', () => {
      const result = IntakePayloadSchema.safeParse({
        rawText: 'Hello',
        channel: 'paste',
        customerName: '陈小华',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Allergy-containing messages are valid inputs', () => {
    // These verify messages with allergy info pass schema validation
    // Actual allergy detection/flagging is handled by the AI pipeline
    const allergyMessages = [
      'My daughter has a peanut allergy — very important!',
      'Please make it completely gluten free, celiac disease',
      'She is severely lactose intolerant',
      'No nuts of any kind please',
      'Vegan cake needed — no eggs, no dairy',
      'Egg-free please, egg allergy',
      'Kosher cake required',
      'Multiple allergies: soy, wheat, dairy',
    ];

    allergyMessages.forEach((msg, i) => {
      it(`accepts allergy message ${i + 1}: "${msg.slice(0, 50)}..."`, () => {
        const result = IntakePayloadSchema.safeParse({ rawText: msg, channel: 'paste' });
        expect(result.success).toBe(true);
      });
    });
  });
});
