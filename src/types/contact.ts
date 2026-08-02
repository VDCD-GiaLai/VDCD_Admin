/**
 * Contact — submitted via the public website's contact form.
 * Maps to DB `contact` table + /contacts API.
 */
export interface Contact {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string | null;
  message: string;
  attachment: string | null;
  isRead: boolean;
  createdAt: string;
}
