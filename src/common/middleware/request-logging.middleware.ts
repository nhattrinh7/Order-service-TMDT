import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { requestContext } from '~/common/context/request-context'

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(req: Request, res: Response, next: NextFunction) {
    const kongRequestId = (req.headers['kong-request-id'] as string) || uuidv4()
    const startTime = Date.now()

    // ở đây ko phải middleware đợi responnse, không phải middleware chạy được cả chiều response
    // mà là nó đăng kí 1 móc câu vào object res. Khi response hoàn tất thì sẽ chạy
    res.on('finish', () => {
      const duration = Date.now() - startTime
      const { method, originalUrl } = req
      const { statusCode } = res

      const logMessage = `${method} ${originalUrl} → ${statusCode} (${duration}ms) [kongRequestId=${kongRequestId}]`

      if (statusCode >= 500) {
        this.logger.error(logMessage)
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage)
      } else {
        this.logger.log(logMessage)
      }
    })

    requestContext.run({ kongRequestId }, () => {
      next()
    })
  }
}
