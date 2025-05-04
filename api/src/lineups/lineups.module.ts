import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LineupsService } from './lineups.service';
import { LineupsController } from './lineups.controller';
import { MigrationService } from './migration.service';
import { Event, EventSchema } from '../models/event.schema';
import { Rsvp, RsvpSchema } from '../models/rsvp.schema';
import { User, UserSchema } from '../models/user.schema';
import { Lineup, LineupSchema, Match, MatchSchema } from '../models/match.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lineup.name, schema: LineupSchema },
      { name: Match.name, schema: MatchSchema },
      { name: Event.name, schema: EventSchema },
      { name: Rsvp.name, schema: RsvpSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [LineupsController],
  providers: [LineupsService, MigrationService],
  exports: [LineupsService, MigrationService],
})
export class LineupsModule {}