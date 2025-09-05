import { config } from '@/config';
import { app } from '@/app';
import { prisma } from '@/config/database';
// import { startVideoFetching, videoFetchWorker } from '@/jobs/videoFetchJob';

const startServer = async () => {
  try {
    
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    
    // await startVideoFetching();
    console.log('✅ Background video fetching started');

   
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🎥 YouTube search query: "${config.youtube.searchQuery}"`);
      console.log(`⏱️  Fetch interval: ${config.youtube.fetchInterval / 1000}s`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      // Close server
      server.close(async () => {
        console.log('📝 HTTP server closed');
        
        // Close worker
        // await videoFetchWorker.close();
        console.log('⚙️ Background worker closed');
        
        // Close database connection
        await prisma.$disconnect();
        console.log('💾 Database disconnected');
        
        process.exit(0);
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error(' Failed to start server:', error);
    process.exit(1);
  }
};

startServer();