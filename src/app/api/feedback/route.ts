import { NextResponse } from 'next/server';
import { getPgPool } from '@/lib/pg';

// For local mock storage when database is not configured.
// Using global to survive Hot Module Replacement (HMR) during dev.
const globalForFeedback = global as unknown as {
  mockFeedbackDb: any[];
};

if (!globalForFeedback.mockFeedbackDb) {
  globalForFeedback.mockFeedbackDb = [];
}

const mockFeedbackDb = globalForFeedback.mockFeedbackDb;

// Allowed categories
const VALID_CATEGORIES = ['Bug', 'Feature idea', 'Data is wrong', 'General'];

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const { category, message, email, rating, pagePath, userAgent } = body;

    // Validate category
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate email (optional)
    if (email && (typeof email !== 'string' || !email.includes('@'))) {
      return NextResponse.json(
        { error: 'If email is provided, it must be a valid email address' },
        { status: 400 }
      );
    }

    // Validate rating (optional)
    if (rating !== undefined && rating !== null) {
      const parsedRating = Number(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5 || !Number.isInteger(parsedRating)) {
        return NextResponse.json(
          { error: 'Rating must be an integer between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Validate pagePath
    if (!pagePath || typeof pagePath !== 'string') {
      return NextResponse.json(
        { error: 'Page path context is required' },
        { status: 400 }
      );
    }

    // Validate userAgent
    if (!userAgent || typeof userAgent !== 'string') {
      return NextResponse.json(
        { error: 'User agent context is required' },
        { status: 400 }
      );
    }

    const pool = getPgPool();
    const cleanEmail = email ? email.trim() : null;
    const cleanRating = rating !== undefined && rating !== null ? Number(rating) : null;

    if (pool) {
      // Connect to PostgreSQL database and insert feedback
      const client = await pool.connect();
      try {
        // Ensure table exists
        await client.query(`
          CREATE TABLE IF NOT EXISTS feedback (
            id SERIAL PRIMARY KEY,
            category VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            email VARCHAR(255),
            rating INTEGER,
            page_path VARCHAR(255) NOT NULL,
            user_agent TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Insert feedback
        const result = await client.query(
          `INSERT INTO feedback (category, message, email, rating, page_path, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *;`,
          [category, message.trim(), cleanEmail, cleanRating, pagePath, userAgent]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
      } finally {
        client.release();
      }
    } else {
      // Database not configured: fallback to in-memory store
      console.warn(
        'FEEDBACK_DB_URL is not set. Saving feedback in-memory (this will reset when the server restarts).'
      );

      const mockFeedback = {
        id: mockFeedbackDb.length + 1,
        category,
        message: message.trim(),
        email: cleanEmail,
        rating: cleanRating,
        page_path: pagePath,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      };

      mockFeedbackDb.push(mockFeedback);
      return NextResponse.json(mockFeedback, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Admin token is not configured on the server. Please set ADMIN_TOKEN env variable.' },
        { status: 500 }
      );
    }

    // Accept the token via Authorization header or ?token= query param
    // (the query param exists so feedback can be viewed directly in a browser).
    const authHeader = request.headers.get('Authorization');
    const queryToken = new URL(request.url).searchParams.get('token');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : queryToken;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Provide a Bearer Authorization header or ?token= query param' },
        { status: 401 }
      );
    }

    if (token !== adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin token' },
        { status: 401 }
      );
    }

    const pool = getPgPool();

    if (pool) {
      const client = await pool.connect();
      try {
        // Check if table exists
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'feedback'
          );
        `);
        
        if (!tableCheck.rows[0].exists) {
          return NextResponse.json([]);
        }

        const result = await client.query(
          'SELECT * FROM feedback ORDER BY created_at DESC;'
        );
        return NextResponse.json(result.rows);
      } finally {
        client.release();
      }
    } else {
      // Return in-memory mock data
      const reversedMockFeedback = [...mockFeedbackDb].reverse();
      return NextResponse.json(reversedMockFeedback);
    }
  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
