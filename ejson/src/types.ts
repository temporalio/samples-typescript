export interface User {
  id: string;
  age?: bigint;
  hp: number;
  matcher: RegExp;
  token: Uint8Array;
  createdAt: Date;
}

export interface Result {
  success: boolean;
  at: Date;
}
