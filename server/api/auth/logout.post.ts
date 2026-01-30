import { AuthService } from '../../services/auth.service'

export default defineEventHandler(async (event) => {
  return await AuthService.logout(event)
})