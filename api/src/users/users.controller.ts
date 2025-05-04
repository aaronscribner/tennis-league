import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Return the user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return the user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const auth0Id = req.user.userId;
    const user = await this.usersService.findByAuth0Id(auth0Id);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    // Sync roles from JWT if they exist
    if (req.user.roles && Array.isArray(req.user.roles) && req.user.roles.length > 0) {
      const jwtRoles = req.user.roles;
      const rolesChanged = !user.roles || 
        user.roles.length !== jwtRoles.length || 
        !user.roles.every(role => jwtRoles.includes(role));
      
      // Update user roles in database if they've changed
      if (rolesChanged) {
        console.log(`Updating roles for user ${auth0Id} from JWT:`, jwtRoles);
        
        // Set primary role based on roles array
        const primaryRole = jwtRoles.includes(UserRole.COORDINATOR) 
          ? UserRole.COORDINATOR 
          : UserRole.PLAYER;
        
        // Use the 'id' property which is available as a string in Mongoose documents
        const userDoc = user as UserDocument;
        const userId = userDoc.id || String(userDoc._id);
        
        const updatedUser = await this.usersService.update(
          userId, 
          {
            roles: jwtRoles,
            role: primaryRole
          }
        );
        
        return updatedUser;
      }
    }
    
    return user;
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ 
    description: 'User profile data to update',
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        phoneNumber: { type: 'string', example: '+1 (123) 456-7890' },
        preferSingles: { type: 'boolean', example: true },
        preferDoubles: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Profile successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: Partial<User>) {
    // Get the current user's Auth0 ID from the JWT token
    const auth0Id = req.user.userId;
    
    // Find the user by Auth0 ID
    const user = await this.usersService.findByAuth0Id(auth0Id);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    // Create a safe update object with only allowed fields
    const allowedFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'preferSingles', 'preferDoubles'];
    const safeUpdate: Partial<User> = {};
    
    // Only include fields that are allowed to be updated
    for (const field of allowedFields) {
      if (updateProfileDto[field] !== undefined) {
        safeUpdate[field] = updateProfileDto[field];
      }
    }
    
    // If email is being changed, check if it already exists
    if (safeUpdate.email && safeUpdate.email !== user.email) {
      const existingUser = await this.usersService.findByEmail(safeUpdate.email);
      if (existingUser && existingUser.auth0Id !== auth0Id) {
        throw new ConflictException('Email already in use by another account');
      }
    }
    
    // Use the existing user's ID to update their profile
    const userDoc = user as UserDocument;
    const userId = userDoc.id || String(userDoc._id);
    
    // Update the user profile
    const updatedUser = await this.usersService.update(userId, safeUpdate);
    return updatedUser;
  }

  @ApiOperation({ summary: 'Get user profile by Auth0 ID' })
  @ApiParam({ name: 'auth0Id', description: 'Auth0 User ID' })
  @ApiResponse({ status: 200, description: 'Return the user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('profile/:auth0Id')
  async getProfileByAuth0Id(@Param('auth0Id') auth0Id: string, @Request() req) {
    const user = await this.usersService.findByAuth0Id(auth0Id);
    
    if (!user) {
      throw new UnauthorizedException(`User with Auth0 ID ${auth0Id} not found`);
    }
    
    // Sync roles from JWT if they exist and if this is the current user
    if (req.user.userId === auth0Id && req.user.roles && Array.isArray(req.user.roles) && req.user.roles.length > 0) {
      const jwtRoles = req.user.roles;
      const rolesChanged = !user.roles || 
        user.roles.length !== jwtRoles.length || 
        !user.roles.every(role => jwtRoles.includes(role));
      
      // Update user roles in database if they've changed
      if (rolesChanged) {
        console.log(`Updating roles for user ${auth0Id} from JWT:`, jwtRoles);
        
        // Set primary role based on roles array
        const primaryRole = jwtRoles.includes(UserRole.COORDINATOR) 
          ? UserRole.COORDINATOR 
          : UserRole.PLAYER;
        
        // Use the 'id' property which is available as a string in Mongoose documents
        const userDoc = user as UserDocument;
        const userId = userDoc.id || String(userDoc._id);
        
        const updatedUser = await this.usersService.update(
          userId,
          {
            roles: jwtRoles,
            role: primaryRole
          }
        );
        
        return updatedUser;
      }
    }
    
    return user;
  }

  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ 
    description: 'User data',
    type: User
  })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  @Post()
  async create(@Body() createUserDto: Partial<User>) {
    // Check if the email exists and is a string
    if (createUserDto.email && typeof createUserDto.email === 'string') {
      // Check if user with email already exists
      const existingUser = await this.usersService.findByEmail(createUserDto.email);
      
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }
    
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ 
    description: 'User data to update',
    type: User
  })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: Partial<User>) {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ 
    description: 'New role',
    schema: {
      type: 'object',
      properties: {
        role: { 
          type: 'string', 
          enum: [UserRole.PLAYER, UserRole.COORDINATOR],
          example: UserRole.COORDINATOR
        }
      },
      required: ['role']
    }
  })
  @ApiResponse({ status: 200, description: 'User role successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR)
  @Patch(':id/role')
  setRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.setRole(id, role as any);
  }
}