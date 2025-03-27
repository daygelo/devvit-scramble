import { Devvit } from '@devvit/public-api';

// Configure Devvit's plugins
Devvit.configure({
  redditAPI: true,
});

// Adds a new menu item to the subreddit allowing to create a new post
Devvit.addMenuItem({
  label: 'Test Unscramble',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      subredditName: subreddit.name,
      title: 'What is this? Unscramble!',
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading Unscrambled Game...</text>
        </vstack>
      ),
    });
    ui.showToast({ text: 'Created post!' });
    ui.navigateTo(post);
  },
});
