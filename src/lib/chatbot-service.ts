import { findBestResponse, isTradesmanQuery, getTradesmanQueryType } from '@/data/chatbot-data';
import getDefaultTradesmanModel, { ITradesman } from '@/models/Tradesman';
import getDefaultTradesmanRatingModel, { ITradesmanRating } from '@/models/TradesmanRating';

export class ChatbotService {
  async handleQuery(query: string, tradesmanId?: string): Promise<string> {
    try {
      // If query is about a specific tradesman and we have their ID
      if (tradesmanId && isTradesmanQuery(query)) {
        return await this.handleTradesmanQuery(query, tradesmanId);
      }

      // Otherwise, find the best matching general response
      return findBestResponse(query);
    } catch (error) {
      console.error('Error handling chatbot query:', error);
      return "I'm sorry, I encountered an error. Please try again or contact support.";
    }
  }

  private async handleTradesmanQuery(query: string, tradesmanId: string): Promise<string> {
    const queryType = getTradesmanQueryType(query);
    const TradesmanModel = getDefaultTradesmanModel();
    const tradesman = await TradesmanModel.findById(tradesmanId);

    if (!tradesman) {
      return "I couldn't find information about this tradesman.";
    }

    switch (queryType) {
      case 'skills':
        return `${tradesman.name} specializes in: ${tradesman.skills.join(', ')}`;

      case 'experience':
        return `${tradesman.name} has ${tradesman.experience} years of experience in the field.`;

      case 'rating': {
        const RatingModel = getDefaultTradesmanRatingModel();
        const ratings = await RatingModel.find({ tradesmanId });
        const averageRating = ratings.reduce((acc: number, curr: ITradesmanRating) => acc + curr.rating, 0) / (ratings.length || 1);
        return `${tradesman.name} has a rating of ${averageRating.toFixed(1)}/5 based on ${ratings.length} reviews.`;
      }

      case 'availability':
        return `${tradesman.name}'s availability: ${tradesman.availability}. Please contact them directly to confirm current availability.`;

      case 'location':
        return `${tradesman.name} works in ${tradesman.city} and serves the following areas: ${tradesman.workingAreas.map(area => area.areaName).join(', ')}`;

      default:
        return findBestResponse(query);
    }
  }
}

export async function getTradesmanInfo(id: string) {
  try {
    const TradesmanModel = getDefaultTradesmanModel();
    const RatingModel = getDefaultTradesmanRatingModel();
    
    const tradesman = await TradesmanModel.findById(id);
    const ratings = await RatingModel.find({ tradesmanId: id });
    
    if (!tradesman) {
      return null;
    }

    const averageRating = ratings.reduce((acc: number, curr: ITradesmanRating) => acc + curr.rating, 0) / (ratings.length || 1);

    return {
      name: tradesman.name,
      skills: tradesman.skills,
      experience: tradesman.experience,
      rating: averageRating.toFixed(1),
      totalRatings: ratings.length
    };
  } catch (error) {
    console.error('Error fetching tradesman info:', error);
    return null;
  }
}

export async function getTradesmanAreas(id: string) {
  try {
    const TradesmanModel = getDefaultTradesmanModel();
    const tradesman = await TradesmanModel.findById(id);
    return tradesman?.workingAreas.map(area => area.areaName) || [];
  } catch (error) {
    console.error('Error fetching tradesman areas:', error);
    return [];
  }
}

export function isAreaInRange(area: string, workingAreas: string[]): boolean {
  return workingAreas.some((workingArea: string) => 
    workingArea.toLowerCase() === area.toLowerCase()
  );
} 