import type { TransitionDirectionalAnimations } from 'astro';

const neonFade: TransitionDirectionalAnimations = {
	forwards: {
		old: {
			name: 'neonFadeOut',
			duration: '0.3s',
			easing: 'ease-out',
			fillMode: 'forwards',
		},
		new: {
			name: 'neonFadeIn',
			duration: '0.3s',
			easing: 'ease-in',
			fillMode: 'backwards',
		},
	},
	backwards: {
		old: {
			name: 'neonFadeOut',
			duration: '0.3s',
			easing: 'ease-out',
			fillMode: 'forwards',
		},
		new: {
			name: 'neonFadeIn',
			duration: '0.3s',
			easing: 'ease-in',
			fillMode: 'backwards',
		},
	},
};

export default neonFade;
