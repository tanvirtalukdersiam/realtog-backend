import { User, IUser } from './user.model.js';
import { ConflictError } from '@utils/apiError.js';
import logger from '@utils/logger.js';

export class UserService {
  // create user
  async createUser(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    provider?: 'local' | 'google';
    role?: 'admin' | 'moderator' | 'user';
  }): Promise<IUser> {
    try {
      // check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { phone: userData.phone }],
      });

      if (existingUser) {
        throw new ConflictError('User with this email or phone already exists');
      }

      const user = new User({
        ...userData,
        provider: userData.provider || 'local',
        role: userData.role || 'user',
      });
      await user.save();
      logger.info(`User created: ${user.email}`);
      return user;
    } catch (error: any) {
      if (error.name === 'MongoServerError' && error.code === 11000) {
        throw new ConflictError('User with this email or phone already exists');
      }
      throw error;
    }
  }

  // find user by email or phone
  async findByEmailOrPhone(identifier: string): Promise<IUser | null> {
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    }).select('+password'); // include password for login
    
    return user;
  }

  // find user by id
  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  // find user by email
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  // find user by phone
  async findByPhone(phone: string): Promise<IUser | null> {
    return User.findOne({ phone });
  }

  // get all users
  async getAllUsers(): Promise<IUser[]> {
    return User.find().select('-password').sort({ createdAt: -1 });
  }

  // update user role
  async updateUserRole(
    userId: string,
    role: 'admin' | 'moderator' | 'user'
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
  }
}

export const userService = new UserService();

