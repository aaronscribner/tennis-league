import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../models/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  async findByAuth0Id(auth0Id: string): Promise<User> {
    return this.userModel.findOne({ auth0Id }).exec();
  }

  async create(createUserDto: Partial<User>): Promise<User> {
    const newUser = new this.userModel(createUserDto);
    return newUser.save();
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
  }

  async setRole(id: string, role: UserRole): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, { role }, { new: true }).exec();
  }

  async updatePreference(id: string, preferSingles: boolean): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, { preferSingles }, { new: true }).exec();
  }

  async updateSkillLevel(id: string, skillLevel: number): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, { skillLevel }, { new: true }).exec();
  }

  async remove(id: string): Promise<User> {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}