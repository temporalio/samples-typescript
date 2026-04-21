import { Language } from '../api';

export function createActivities() {
  return {
    async callGreetingService(): Promise<Partial<Record<Language, string>>> {
      return {
        arabic: 'مرحبا بالعالم',
        chinese: '你好，世界',
        english: 'Hello, world',
        french: 'Bonjour, monde',
        hindi: 'नमस्ते दुनिया',
        portuguese: 'Olá, mundo',
        spanish: 'Hola, mundo',
      };
    },
  };
}
