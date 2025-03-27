import { Devvit, useChannel, useState } from '@devvit/public-api';
import './createPost.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
  realtime: true,
});

Devvit.addCustomPostType({
  name: 'Unscramble!',
  height: 'tall',
  render: (context) => {
    const [image] = useState<string>(async () => await context.redis.get(`${context.postId}_image`));
    const [answer] = useState<string>(async () => await context.redis.get(`${context.postId}_answer`));
    const [state, setState] = useState<number[]>(async () => {
      const fetchedData = await context.redis.get(`${context.postId}_state`);
      if (fetchedData) return JSON.parse(fetchedData);

      const initialData = Array.apply(null, Array(64)).map((_, i) => i);
      for (let i = initialData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialData[i], initialData[j]] = [initialData[j], initialData[i]];
      }

      await context.redis.set(`${context.postId}_state`, JSON.stringify(initialData));

      return initialData;
    });

    const onMessage = async (message) => {
      switch (message.type) {
        case 'ready':
          context.ui.webView.postMessage({ type: 'update', data: { state, image, answer } });
          break;

        case 'correct':
          context.ui.showToast('Congrats! You got it!');
          break;

        case 'wrong':
          context.ui.showToast('Nope! That’s not it, try again!');
          break;

        case 'create':
          const subreddit = await context.reddit.getCurrentSubreddit();
          const post = await context.reddit.submitPost({
            subredditName: subreddit.name,
            title: 'What is this? Unscramble!',
            preview: (
              <vstack width="100%" height="100%" alignment="middle center" backgroundColor="#642f1e">
                <text size="xxlarge" color="white" weight="bold">Loading Unscramble!...</text>
              </vstack>
            ),
          });

          await context.redis.set(`${post.id}_image`, message.data.image);
          await context.redis.set(`${post.id}_answer`, message.data.answer);
          context.ui.showToast({ text: 'Successfully created your post!' });
          context.ui.navigateTo(post);
          break;

        case 'swap':
          const newState = state;

          [
            newState[message.data[0]],
            newState[message.data[1]],
          ] = [
            newState[message.data[1]],
            newState[message.data[0]],
          ];

          setState(newState);
          await context.redis.set(`${context.postId}_state`, JSON.stringify(newState));
          await channel.send(newState);
          break;

        default:
          throw new Error(`Unknown message type: ${message satisfies never}`);
      }
    }

    const channel = useChannel({
      name: `${context.postId}`,
      onMessage: (newState) => {
        setState(newState);
        context.ui.webView.postMessage({ type: 'update', data: { state: newState } });
      },
    });
    channel.subscribe();

    return (
      <zstack width='100%' height='100%'>
        <vstack width='100%' height='100%' alignment='middle center' backgroundColor='#642f1e'>
          <text size='xxlarge' color='white' weight='bold'>Loading Unscramble!...</text>
        </vstack>
        <webview url='page.html' onMessage={onMessage} width='100%' height='100%'/>
      </zstack>
    );
  },
});

export default Devvit;
