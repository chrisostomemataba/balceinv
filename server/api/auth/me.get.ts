import { AuthService } from '../../services/auth.service';

export default defineEventHandler(async (event) => {
  return AuthService.getCurrentUser(event);
});