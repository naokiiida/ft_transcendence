import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    service = new ChatService();
  });

  describe('validate', () => {
    it('accepts a valid message', () => {
      const result = service.validate('user1', {
        type: 'chat_message',
        content: 'Hello!',
      });
      expect(result).toEqual({ ok: true, content: 'Hello!' });
    });

    it('trims whitespace from content', () => {
      const result = service.validate('user1', {
        type: 'chat_message',
        content: '  Hello!  ',
      });
      expect(result).toEqual({ ok: true, content: 'Hello!' });
    });

    it('rejects whitespace-only content', () => {
      const result = service.validate('user1', {
        type: 'chat_message',
        content: '   ',
      });
      expect(result).toEqual({ ok: false, error: 'Message cannot be empty' });
    });

    it('rejects empty string content', () => {
      const result = service.validate('user1', {
        type: 'chat_message',
        content: '',
      });
      expect(result.ok).toBe(false);
    });

    it('rejects content over 200 chars', () => {
      const result = service.validate('user1', {
        type: 'chat_message',
        content: 'a'.repeat(201),
      });
      expect(result.ok).toBe(false);
    });

    it('accepts content at exactly 200 chars', () => {
      const result = service.validate('user1', {
        type: 'chat_message',
        content: 'a'.repeat(200),
      });
      expect(result.ok).toBe(true);
    });

    it('rejects missing type field', () => {
      const result = service.validate('user1', { content: 'hi' });
      expect(result.ok).toBe(false);
    });

    it('rejects wrong type field', () => {
      const result = service.validate('user1', { type: 'input', content: 'hi' });
      expect(result.ok).toBe(false);
    });

    it('rejects missing content field', () => {
      const result = service.validate('user1', { type: 'chat_message' });
      expect(result.ok).toBe(false);
    });

    it('rate limits after 5 messages in 10 seconds', () => {
      for (let i = 0; i < 5; i++) {
        const r = service.validate('user1', { type: 'chat_message', content: `msg${i}` });
        expect(r.ok).toBe(true);
      }
      const r6 = service.validate('user1', { type: 'chat_message', content: 'msg5' });
      expect(r6).toEqual({
        ok: false,
        error: 'Rate limited. Please wait before sending more messages.',
      });
    });

    it('rate limits are per-user', () => {
      for (let i = 0; i < 5; i++) {
        service.validate('user1', { type: 'chat_message', content: `msg${i}` });
      }
      const result = service.validate('user2', { type: 'chat_message', content: 'hello' });
      expect(result.ok).toBe(true);
    });
  });

  describe('clearUser', () => {
    it('removes rate limit state so user can send again', () => {
      for (let i = 0; i < 5; i++) {
        service.validate('user1', { type: 'chat_message', content: `msg${i}` });
      }
      service.clearUser('user1');
      const result = service.validate('user1', { type: 'chat_message', content: 'after clear' });
      expect(result.ok).toBe(true);
    });

    it('does not throw for unknown user', () => {
      expect(() => service.clearUser('unknown')).not.toThrow();
    });
  });
});
