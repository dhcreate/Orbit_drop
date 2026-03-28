// Service Pattern Integrations (Mocks)

export interface RoomDetails {
  code: string;
  isHost: boolean;
}

export const HostelServices = {
  /**
   * Mock implementation to create a room.
   */
  createRoom: async (): Promise<RoomDetails> => {
    // TODO: FastAPI Create Room
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a random 6 char monospace code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        resolve({ code, isHost: true });
      }, 600);
    });
  },

  /**
   * Mock implementation to join a room.
   */
  joinRoom: async (code: string): Promise<RoomDetails> => {
    // TODO: FastAPI Join Room
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (code.length === 6) {
          resolve({ code: code.toUpperCase(), isHost: false });
        } else {
          reject(new Error("Invalid room code"));
        }
      }, 500);
    });
  },

  /**
   * Mock implementation to get presigned URL for upload.
   */
  getUploadUrl: async (filename: string): Promise<string> => {
    // TODO: Cloudflare R2 Presigned URL
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://mock-r2-url.local/upload?file=${encodeURIComponent(filename)}`);
      }, 300);
    });
  },

  /**
   * Mock method to establish WebSocket connection for Presence.
   */
  connectPresence: (roomCode: string, onUpdate: (count: number) => void) => {
    // TODO: WebSocket Presence
    // Simulate initial presence
    onUpdate(1);
    
    // Simulate someone joining a bit later
    const timer = setTimeout(() => {
      onUpdate(2);
    }, 4000);

    return () => clearTimeout(timer); // cleanup fn
  }
};
