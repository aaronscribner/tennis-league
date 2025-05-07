import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../models/user.schema';
import { UserRole } from '../models/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.userModel.findOne({ auth0Id }).exec();
  }

  async create(createUserDto: Partial<User>): Promise<User> {
    const newUser = new this.userModel(createUserDto);
    const savedUser = await newUser.save();
    return savedUser;
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User> {
    const existingUser = await this.userModel.findById(id).exec();
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    // Update the user
    const updatedUser = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found after update`);
    }
    
    return updatedUser;
  }

  async setRole(id: string, role: UserRole): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, { role }, { new: true }).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async setPreference(id: string, preferSingles: boolean): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, { preferSingles }, { new: true }).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async setSkillLevel(id: string, skillLevel: number): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, { skillLevel }, { new: true }).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async remove(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}