import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TimeLogInterceptor } from './interceptors/time-log.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new TimeLogInterceptor());
  await app.listen(3000);
}
bootstrap();
