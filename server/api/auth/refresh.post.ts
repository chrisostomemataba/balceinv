import { AuthService } from '../../services/auth.service.ts'

export default defineEventHandler(async (event) => {
  return await AuthService.refresh(event)
})