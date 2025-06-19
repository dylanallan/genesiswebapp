import { corsHeaders } from './cors.ts'

export class AppError extends Error {
  constructor(message: string, public statusCode: number, public code?: string) {
    super(message)
    this.name = 'AppError'
  }
}

export const withErrorHandling = (fn: (req: Request) => Promise<Response>) => {
  return async (req: Request) => {
    try {
      return await fn(req)
    } catch (error) {
      console.error('Error in Edge Function:', error)
      
      let statusCode = 500
      let message = 'Internal Server Error'
      let code = 'INTERNAL_SERVER_ERROR'

      if (error instanceof AppError) {
        statusCode = error.statusCode
        message = error.message
        code = error.code || code
      } else if (error instanceof Error) {
        message = error.message
      }

      return new Response(
        JSON.stringify({
          status: 'error',
          code,
          message,
          timestamp: new Date().toISOString()
        }),
        {
          status: statusCode,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }
  }
} 