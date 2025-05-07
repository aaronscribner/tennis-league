import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvitationCodesController } from './invitation-codes.controller';
import { InvitationCodesService } from './invitation-codes.service';
import { InvitationCode, InvitationCodeSchema } from '../models/invitation-code.schema';
import { User, UserSchema } from '../models/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InvitationCode.name, schema: InvitationCodeSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [InvitationCodesController],
  providers: [InvitationCodesService],
  exports: [InvitationCodesService]
})
export class InvitationCodesModule {}