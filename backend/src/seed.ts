import { prisma } from './lib/prisma.js';
import { hashPassword } from './utils/auth.utils.js';

const users = [
  {
    email: 'john@example.com',
    username: 'johndoe',
    name: 'John Doe',
    bio: 'Software engineer passionate about open source',
    password: 'password123',
  },
  {
    email: 'jane@example.com',
    username: 'janesmith',
    name: 'Jane Smith',
    bio: 'Product designer | Coffee enthusiast',
    password: 'password123',
  },
  {
    email: 'alice@example.com',
    username: 'alicejohnson',
    name: 'Alice Johnson',
    bio: 'Full-stack developer | React | Node.js',
    password: 'password123',
  },
  {
    email: 'bob@example.com',
    username: 'bobwilliams',
    name: 'Bob Williams',
    bio: 'DevOps engineer | Cloud architecture',
    password: 'password123',
  },
  {
    email: 'carol@example.com',
    username: 'carolbrown',
    name: 'Carol Brown',
    bio: 'Tech lead | Mentor | Speaker',
    password: 'password123',
  },
  {
    email: 'david@example.com',
    username: 'davidmiller',
    name: 'David Miller',
    bio: 'Mobile developer | iOS | Android',
    password: 'password123',
  },
  {
    email: 'emma@example.com',
    username: 'emmadavis',
    name: 'Emma Davis',
    bio: 'Data scientist | ML enthusiast',
    password: 'password123',
  },
  {
    email: 'frank@example.com',
    username: 'frankwilson',
    name: 'Frank Wilson',
    bio: 'Backend developer | Python | Go',
    password: 'password123',
  },
  {
    email: 'grace@example.com',
    username: 'gracetaylor',
    name: 'Grace Taylor',
    bio: 'UX researcher | Human-centered design',
    password: 'password123',
  },
  {
    email: 'henry@example.com',
    username: 'henryanderson',
    name: 'Henry Anderson',
    bio: 'Security engineer | Ethical hacker',
    password: 'password123',
  },
  {
    email: 'demo@example.com',
    username: 'demo',
    name: 'Demo User',
    bio: 'This is a demo account for testing purposes',
    password: 'demo1234',
  },
];

const tweets = [
  'Just shipped a new feature! Feels great to see it in production.',
  'Working on an interesting project using TypeScript and React. The developer experience is amazing!',
  'Hot take: tabs are better than spaces. Fight me.',
  'Anyone else excited about the new ES2024 features?',
  'Coffee is the fuel that powers great code. Change my mind.',
  'Just finished reading "Clean Code". Highly recommend it to every developer!',
  "Debugging is like being a detective in a crime movie where you're also the murderer.",
  "The best code is no code at all. Every line you don't write is bug-free.",
  'Learning Rust has been challenging but rewarding. The compiler is your best friend.',
  'Remember: premature optimization is the root of all evil.',
  'Spent 4 hours debugging. Turns out I missed a semicolon. Classic.',
  'The best documentation is a well-written codebase.',
  'Always code as if the person who ends up maintaining your code will be a violent psychopath who knows where you live.',
  "There's no place like 127.0.0.1",
  'Testing in production is underrated. (Please dont actually do this)',
  'Started learning a new framework today. Day 1: This is easy! Day 2: What is happening?',
  'Git commit messages matter. Future you will thank present you.',
  "Code reviews are not about finding bugs. They're about sharing knowledge.",
  'The best feature is the one that solves a real user problem.',
  'Just deployed to production on a Friday. Living dangerously!',
];

const replies = [
  'Totally agree!',
  'This is so true.',
  'Great point!',
  "Couldn't have said it better myself.",
  'Interesting perspective.',
  'Thanks for sharing!',
  'I learned something new today.',
  'Haha, this is hilarious!',
  'Can you elaborate on this?',
  'I had the same experience!',
];

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.tweet.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data');

  // Create users
  const createdUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await hashPassword(user.password);
      return prisma.user.create({
        data: {
          email: user.email,
          username: user.username,
          name: user.name,
          bio: user.bio,
          password: hashedPassword,
        },
      });
    })
  );

  console.log(`Created ${createdUsers.length} users`);

  // Create tweets for each user
  const createdTweets = [];
  for (const user of createdUsers) {
    // Each user creates 2-4 tweets
    const numTweets = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < numTweets; i++) {
      const randomTweet = tweets[Math.floor(Math.random() * tweets.length)];
      const tweet = await prisma.tweet.create({
        data: {
          content: randomTweet,
          authorId: user.id,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in past week
        },
      });
      createdTweets.push(tweet);
    }
  }

  console.log(`Created ${createdTweets.length} tweets`);

  // Create some replies
  const repliesCreated = [];
  for (let i = 0; i < 15; i++) {
    const randomTweet = createdTweets[Math.floor(Math.random() * createdTweets.length)];
    const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
    const randomReply = replies[Math.floor(Math.random() * replies.length)];

    const reply = await prisma.tweet.create({
      data: {
        content: randomReply,
        authorId: randomUser.id,
        parentId: randomTweet.id,
        createdAt: new Date(randomTweet.createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000),
      },
    });
    repliesCreated.push(reply);
  }

  console.log(`Created ${repliesCreated.length} replies`);

  // Create follows (each user follows 3-6 other users)
  const followsCreated = [];
  for (const user of createdUsers) {
    const otherUsers = createdUsers.filter((u) => u.id !== user.id);
    const numFollows = Math.floor(Math.random() * 4) + 3;
    const usersToFollow = otherUsers
      .sort(() => Math.random() - 0.5)
      .slice(0, numFollows);

    for (const userToFollow of usersToFollow) {
      try {
        const follow = await prisma.follow.create({
          data: {
            followerId: user.id,
            followingId: userToFollow.id,
          },
        });
        followsCreated.push(follow);
      } catch {
        // Ignore duplicate follow errors
      }
    }
  }

  console.log(`Created ${followsCreated.length} follows`);

  // Create likes (each user likes 5-10 tweets)
  const likesCreated = [];
  for (const user of createdUsers) {
    const allTweets = [...createdTweets, ...repliesCreated];
    const numLikes = Math.floor(Math.random() * 6) + 5;
    const tweetsToLike = allTweets
      .sort(() => Math.random() - 0.5)
      .slice(0, numLikes);

    for (const tweet of tweetsToLike) {
      try {
        const like = await prisma.like.create({
          data: {
            userId: user.id,
            tweetId: tweet.id,
          },
        });
        likesCreated.push(like);
      } catch {
        // Ignore duplicate like errors
      }
    }
  }

  console.log(`Created ${likesCreated.length} likes`);

  console.log('\nSeed completed successfully!');
  console.log('\nTest credentials:');
  console.log('  Email: demo@example.com');
  console.log('  Password: demo1234');
  console.log('\nOr use any of these emails with password "password123":');
  users.slice(0, -1).forEach((u) => console.log(`  - ${u.email}`));
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
