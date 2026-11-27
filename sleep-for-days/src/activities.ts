// A stub Activity for sending an email.
type SendEmailInput = { msg: string };

export async function sendEmail({ msg }: SendEmailInput): Promise<void> {
  console.log(`Email message: ${msg}`);
}
