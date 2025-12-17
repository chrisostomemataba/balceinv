import { AuthService } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  return await AuthService.refresh(event)
})