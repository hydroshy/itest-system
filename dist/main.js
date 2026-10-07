"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cookieParser = require("cookie-parser");
const path = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets(path.join(process.cwd(), 'public', 'images'), {
        prefix: '/images/',
    });
    app.useStaticAssets(path.join(process.cwd(), 'public'), {
        prefix: '/public/',
    });
    app.use(cookieParser());
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: false,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('LoRaWAN Network & IoT Platform API')
        .setDescription('NestJS Backend với Dynamic PostgreSQL Table-to-DB Routing & RBAC')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`🚀 LoRaWAN Platform Backend server is running on: http://localhost:${port}`);
    logger.log(`📚 Swagger API Documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map