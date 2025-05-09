import Airtable from 'airtable';

// Инициализация Airtable с Personal Access Token
const base = new Airtable({
  apiKey: process.env.REACT_APP_AIRTABLE_PERSONAL_ACCESS_TOKEN,
  endpointUrl: 'https://api.airtable.com'
}).base(process.env.REACT_APP_AIRTABLE_BASE_ID || '');

const TABLE_NAME = 'Leaderboard'; // 

export type LeaderboardEntry = {
  id: string;
  nickname: string;
  profitNet: number;
  date: string;
  isCurrentPlayer?: boolean;
};

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const records = await base(TABLE_NAME)
      .select({
        maxRecords: 10,
        sort: [{ field: 'profitNet', direction: 'desc' }]
      })
      .all();

    return records.map(record => ({
      id: record.id,
      nickname: record.get('nickname') as string,
      profitNet: record.get('profitNet') as number,
      date: record.get('date') as string,
      isCurrentPlayer: false
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export async function addToLeaderboard(entry: Omit<LeaderboardEntry, 'id' | 'date'>): Promise<LeaderboardEntry | null> {
  try {
    console.log('Creating new leaderboard entry:', entry);
    
    if (!process.env.REACT_APP_AIRTABLE_PERSONAL_ACCESS_TOKEN) {
      console.error('Airtable Personal Access Token is not configured');
      return null;
    }

    if (!process.env.REACT_APP_AIRTABLE_BASE_ID) {
      console.error('Airtable Base ID is not configured');
      return null;
    }

    const record = await base(TABLE_NAME).create({
      nickname: entry.nickname,
      profitNet: entry.profitNet,
      date: new Date().toISOString()
    });

    console.log('Successfully created record:', record);

    const newEntry = {
      id: record.id,
      nickname: record.get('nickname') as string,
      profitNet: record.get('profitNet') as number,
      date: record.get('date') as string,
      isCurrentPlayer: true
    };

    console.log('Formatted entry:', newEntry);
    return newEntry;
  } catch (error) {
    console.error('Error adding to leaderboard:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return null;
  }
} 
