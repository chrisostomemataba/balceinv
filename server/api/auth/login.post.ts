import { AuthService } from "../../services/auth"

export default defineEventHandler(async (event) => {
  return await AuthService.login(event)
})