import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { LineupsModule } from './lineups/lineups.module';
import { RatingsModule } from './ratings/ratings.module';
import { InvitationCodesModule } from './invitation-codes/invitation-codes.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    EventsModule,
    LineupsModule,
    RatingsModule,
    InvitationCodesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
