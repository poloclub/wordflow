const layout = {
  sidebarMenuXOffset: 12
};

const time = {
  mouseenterDelay: 300
};

const customColors = {
  addedColor: 'hsl(120, 37%, 88%)',
  replacedColor: 'hsl(35, 100%, 89%)',
  deletedColor: 'hsl(353, 100%, 93%)'
};

const urls = {
  wordflowEndpoint:
    'https://62uqq9jku8.execute-api.us-east-1.amazonaws.com/prod/records'
  // 'https://hma6pxgvnp.execute-api.localhost.localstack.cloud:4566/prod/records'
};

const colors = {
  'red-50': 'hsl(350, 100.0%, 96.08%)',
  'red-100': 'hsl(354, 100.0%, 90.2%)',
  'red-200': 'hsl(0, 72.65%, 77.06%)',
  'red-300': 'hsl(0, 68.67%, 67.45%)',
  'red-400': 'hsl(1, 83.25%, 62.55%)',
  'red-500': 'hsl(4, 89.62%, 58.43%)',
  'red-600': 'hsl(1, 77.19%, 55.29%)',
  'red-700': 'hsl(0, 65.08%, 50.59%)',
  'red-800': 'hsl(0, 66.39%, 46.67%)',
  'red-900': 'hsl(0, 73.46%, 41.37%)',
  'red-a100': 'hsl(4, 100.0%, 75.1%)',
  'red-a200': 'hsl(0, 100.0%, 66.08%)',
  'red-a400': 'hsl(348, 100.0%, 54.51%)',
  'red-a700': 'hsl(0, 100.0%, 41.76%)',

  'pink-50': 'hsl(340, 80.0%, 94.12%)',
  'pink-100': 'hsl(339, 81.33%, 85.29%)',
  'pink-200': 'hsl(339, 82.11%, 75.88%)',
  'pink-300': 'hsl(339, 82.56%, 66.27%)',
  'pink-400': 'hsl(339, 81.9%, 58.82%)',
  'pink-500': 'hsl(339, 82.19%, 51.57%)',
  'pink-600': 'hsl(338, 77.78%, 47.65%)',
  'pink-700': 'hsl(336, 77.98%, 42.75%)',
  'pink-800': 'hsl(333, 79.27%, 37.84%)',
  'pink-900': 'hsl(328, 81.33%, 29.41%)',
  'pink-a100': 'hsl(339, 100.0%, 75.1%)',
  'pink-a200': 'hsl(339, 100.0%, 62.55%)',
  'pink-a400': 'hsl(338, 100.0%, 48.04%)',
  'pink-a700': 'hsl(333, 84.11%, 41.96%)',

  'purple-50': 'hsl(292, 44.44%, 92.94%)',
  'purple-100': 'hsl(291, 46.07%, 82.55%)',
  'purple-200': 'hsl(291, 46.94%, 71.18%)',
  'purple-300': 'hsl(291, 46.6%, 59.61%)',
  'purple-400': 'hsl(291, 46.61%, 50.78%)',
  'purple-500': 'hsl(291, 63.72%, 42.16%)',
  'purple-600': 'hsl(287, 65.05%, 40.39%)',
  'purple-700': 'hsl(282, 67.88%, 37.84%)',
  'purple-800': 'hsl(277, 70.17%, 35.49%)',
  'purple-900': 'hsl(267, 75.0%, 31.37%)',
  'purple-a100': 'hsl(291, 95.38%, 74.51%)',
  'purple-a200': 'hsl(291, 95.9%, 61.76%)',
  'purple-a400': 'hsl(291, 100.0%, 48.82%)',
  'purple-a700': 'hsl(280, 100.0%, 50.0%)',

  'deep-purple-50': 'hsl(264, 45.45%, 93.53%)',
  'deep-purple-100': 'hsl(261, 45.68%, 84.12%)',
  'deep-purple-200': 'hsl(261, 46.27%, 73.73%)',
  'deep-purple-300': 'hsl(261, 46.81%, 63.14%)',
  'deep-purple-400': 'hsl(261, 46.72%, 55.1%)',
  'deep-purple-500': 'hsl(261, 51.87%, 47.25%)',
  'deep-purple-600': 'hsl(259, 53.91%, 45.1%)',
  'deep-purple-700': 'hsl(257, 57.75%, 41.76%)',
  'deep-purple-800': 'hsl(254, 60.8%, 39.02%)',
  'deep-purple-900': 'hsl(251, 68.79%, 33.92%)',
  'deep-purple-a100': 'hsl(261, 100.0%, 76.67%)',
  'deep-purple-a200': 'hsl(255, 100.0%, 65.1%)',
  'deep-purple-a400': 'hsl(258, 100.0%, 56.08%)',
  'deep-purple-a700': 'hsl(265, 100.0%, 45.88%)',

  'indigo-50': 'hsl(231, 43.75%, 93.73%)',
  'indigo-100': 'hsl(231, 45.0%, 84.31%)',
  'indigo-200': 'hsl(230, 44.36%, 73.92%)',
  'indigo-300': 'hsl(230, 44.09%, 63.53%)',
  'indigo-400': 'hsl(230, 44.25%, 55.69%)',
  'indigo-500': 'hsl(230, 48.36%, 47.84%)',
  'indigo-600': 'hsl(231, 50.0%, 44.71%)',
  'indigo-700': 'hsl(231, 53.62%, 40.59%)',
  'indigo-800': 'hsl(232, 57.22%, 36.67%)',
  'indigo-900': 'hsl(234, 65.79%, 29.8%)',
  'indigo-a100': 'hsl(230, 100.0%, 77.45%)',
  'indigo-a200': 'hsl(230, 98.84%, 66.08%)',
  'indigo-a400': 'hsl(230, 98.97%, 61.76%)',
  'indigo-a700': 'hsl(230, 99.04%, 59.22%)',

  'blue-50': 'hsl(205, 86.67%, 94.12%)',
  'blue-100': 'hsl(207, 88.89%, 85.88%)',
  'blue-200': 'hsl(206, 89.74%, 77.06%)',
  'blue-300': 'hsl(206, 89.02%, 67.84%)',
  'blue-400': 'hsl(206, 89.95%, 60.98%)',
  'blue-500': 'hsl(206, 89.74%, 54.12%)',
  'blue-600': 'hsl(208, 79.28%, 50.78%)',
  'blue-700': 'hsl(209, 78.72%, 46.08%)',
  'blue-800': 'hsl(211, 80.28%, 41.76%)',
  'blue-900': 'hsl(216, 85.06%, 34.12%)',
  'blue-a100': 'hsl(217, 100.0%, 75.49%)',
  'blue-a200': 'hsl(217, 100.0%, 63.33%)',
  'blue-a400': 'hsl(217, 100.0%, 58.04%)',
  'blue-a700': 'hsl(224, 100.0%, 58.04%)',

  'light-blue-50': 'hsl(198, 93.55%, 93.92%)',
  'light-blue-100': 'hsl(198, 92.41%, 84.51%)',
  'light-blue-200': 'hsl(198, 92.37%, 74.31%)',
  'light-blue-300': 'hsl(198, 91.3%, 63.92%)',
  'light-blue-400': 'hsl(198, 91.93%, 56.27%)',
  'light-blue-500': 'hsl(198, 97.57%, 48.43%)',
  'light-blue-600': 'hsl(199, 97.41%, 45.49%)',
  'light-blue-700': 'hsl(201, 98.1%, 41.37%)',
  'light-blue-800': 'hsl(202, 97.91%, 37.45%)',
  'light-blue-900': 'hsl(206, 98.72%, 30.59%)',
  'light-blue-a100': 'hsl(198, 100.0%, 75.1%)',
  'light-blue-a200': 'hsl(198, 100.0%, 62.55%)',
  'light-blue-a400': 'hsl(198, 100.0%, 50.0%)',
  'light-blue-a700': 'hsl(202, 100.0%, 45.88%)',

  'cyan-50': 'hsl(186, 72.22%, 92.94%)',
  'cyan-100': 'hsl(186, 71.11%, 82.35%)',
  'cyan-200': 'hsl(186, 71.62%, 70.98%)',
  'cyan-300': 'hsl(186, 71.15%, 59.22%)',
  'cyan-400': 'hsl(186, 70.87%, 50.2%)',
  'cyan-500': 'hsl(186, 100.0%, 41.57%)',
  'cyan-600': 'hsl(186, 100.0%, 37.84%)',
  'cyan-700': 'hsl(185, 100.0%, 32.75%)',
  'cyan-800': 'hsl(185, 100.0%, 28.04%)',
  'cyan-900': 'hsl(182, 100.0%, 19.61%)',
  'cyan-a100': 'hsl(180, 100.0%, 75.88%)',
  'cyan-a200': 'hsl(180, 100.0%, 54.71%)',
  'cyan-a400': 'hsl(186, 100.0%, 50.0%)',
  'cyan-a700': 'hsl(187, 100.0%, 41.57%)',

  'teal-50': 'hsl(176, 40.91%, 91.37%)',
  'teal-100': 'hsl(174, 41.28%, 78.63%)',
  'teal-200': 'hsl(174, 41.9%, 64.9%)',
  'teal-300': 'hsl(174, 41.83%, 50.78%)',
  'teal-400': 'hsl(174, 62.75%, 40.0%)',
  'teal-500': 'hsl(174, 100.0%, 29.41%)',
  'teal-600': 'hsl(173, 100.0%, 26.86%)',
  'teal-700': 'hsl(173, 100.0%, 23.73%)',
  'teal-800': 'hsl(172, 100.0%, 20.59%)',
  'teal-900': 'hsl(169, 100.0%, 15.1%)',
  'teal-a100': 'hsl(166, 100.0%, 82.75%)',
  'teal-a200': 'hsl(165, 100.0%, 69.61%)',
  'teal-a400': 'hsl(165, 82.26%, 51.37%)',
  'teal-a700': 'hsl(171, 100.0%, 37.45%)',

  'green-50': 'hsl(124, 39.39%, 93.53%)',
  'green-100': 'hsl(121, 37.5%, 84.31%)',
  'green-200': 'hsl(122, 37.4%, 74.31%)',
  'green-300': 'hsl(122, 38.46%, 64.31%)',
  'green-400': 'hsl(122, 38.46%, 56.67%)',
  'green-500': 'hsl(122, 39.44%, 49.22%)',
  'green-600': 'hsl(122, 40.97%, 44.51%)',
  'green-700': 'hsl(122, 43.43%, 38.82%)',
  'green-800': 'hsl(123, 46.2%, 33.53%)',
  'green-900': 'hsl(124, 55.37%, 23.73%)',
  'green-a100': 'hsl(136, 77.22%, 84.51%)',
  'green-a200': 'hsl(150, 81.82%, 67.65%)',
  'green-a400': 'hsl(150, 100.0%, 45.1%)',
  'green-a700': 'hsl(144, 100.0%, 39.22%)',

  'light-green-50': 'hsl(88, 51.72%, 94.31%)',
  'light-green-100': 'hsl(87, 50.68%, 85.69%)',
  'light-green-200': 'hsl(88, 50.0%, 76.47%)',
  'light-green-300': 'hsl(87, 50.0%, 67.06%)',
  'light-green-400': 'hsl(87, 50.24%, 59.8%)',
  'light-green-500': 'hsl(87, 50.21%, 52.75%)',
  'light-green-600': 'hsl(89, 46.12%, 48.04%)',
  'light-green-700': 'hsl(92, 47.91%, 42.16%)',
  'light-green-800': 'hsl(95, 49.46%, 36.47%)',
  'light-green-900': 'hsl(103, 55.56%, 26.47%)',
  'light-green-a100': 'hsl(87, 100.0%, 78.24%)',
  'light-green-a200': 'hsl(87, 100.0%, 67.45%)',
  'light-green-a400': 'hsl(92, 100.0%, 50.59%)',
  'light-green-a700': 'hsl(96, 81.15%, 47.84%)',

  'lime-50': 'hsl(65, 71.43%, 94.51%)',
  'lime-100': 'hsl(64, 69.01%, 86.08%)',
  'lime-200': 'hsl(65, 70.69%, 77.25%)',
  'lime-300': 'hsl(65, 70.37%, 68.24%)',
  'lime-400': 'hsl(65, 69.7%, 61.18%)',
  'lime-500': 'hsl(65, 69.96%, 54.31%)',
  'lime-600': 'hsl(63, 59.68%, 49.61%)',
  'lime-700': 'hsl(62, 61.43%, 43.73%)',
  'lime-800': 'hsl(59, 62.89%, 38.04%)',
  'lime-900': 'hsl(53, 69.93%, 30.0%)',
  'lime-a100': 'hsl(65, 100.0%, 75.29%)',
  'lime-a200': 'hsl(65, 100.0%, 62.75%)',
  'lime-a400': 'hsl(73, 100.0%, 50.0%)',
  'lime-a700': 'hsl(75, 100.0%, 45.88%)',

  'yellow-50': 'hsl(55, 100.0%, 95.29%)',
  'yellow-100': 'hsl(53, 100.0%, 88.43%)',
  'yellow-200': 'hsl(53, 100.0%, 80.78%)',
  'yellow-300': 'hsl(53, 100.0%, 73.14%)',
  'yellow-400': 'hsl(53, 100.0%, 67.25%)',
  'yellow-500': 'hsl(53, 100.0%, 61.57%)',
  'yellow-600': 'hsl(48, 98.04%, 60.0%)',
  'yellow-700': 'hsl(42, 96.26%, 58.04%)',
  'yellow-800': 'hsl(37, 94.64%, 56.08%)',
  'yellow-900': 'hsl(28, 91.74%, 52.55%)',
  'yellow-a100': 'hsl(60, 100.0%, 77.65%)',
  'yellow-a200': 'hsl(60, 100.0%, 50.0%)',
  'yellow-a400': 'hsl(55, 100.0%, 50.0%)',
  'yellow-a700': 'hsl(50, 100.0%, 50.0%)',

  'amber-50': 'hsl(46, 100.0%, 94.12%)',
  'amber-100': 'hsl(45, 100.0%, 85.1%)',
  'amber-200': 'hsl(45, 100.0%, 75.49%)',
  'amber-300': 'hsl(45, 100.0%, 65.49%)',
  'amber-400': 'hsl(45, 100.0%, 57.84%)',
  'amber-500': 'hsl(45, 100.0%, 51.37%)',
  'amber-600': 'hsl(42, 100.0%, 50.0%)',
  'amber-700': 'hsl(37, 100.0%, 50.0%)',
  'amber-800': 'hsl(33, 100.0%, 50.0%)',
  'amber-900': 'hsl(26, 100.0%, 50.0%)',
  'amber-a100': 'hsl(47, 100.0%, 74.9%)',
  'amber-a200': 'hsl(47, 100.0%, 62.55%)',
  'amber-a400': 'hsl(46, 100.0%, 50.0%)',
  'amber-a700': 'hsl(40, 100.0%, 50.0%)',

  'orange-50': 'hsl(36, 100.0%, 93.92%)',
  'orange-100': 'hsl(35, 100.0%, 84.9%)',
  'orange-200': 'hsl(35, 100.0%, 75.1%)',
  'orange-300': 'hsl(35, 100.0%, 65.1%)',
  'orange-400': 'hsl(35, 100.0%, 57.45%)',
  'orange-500': 'hsl(35, 100.0%, 50.0%)',
  'orange-600': 'hsl(33, 100.0%, 49.22%)',
  'orange-700': 'hsl(30, 100.0%, 48.04%)',
  'orange-800': 'hsl(27, 100.0%, 46.86%)',
  'orange-900': 'hsl(21, 100.0%, 45.1%)',
  'orange-a100': 'hsl(38, 100.0%, 75.1%)',
  'orange-a200': 'hsl(33, 100.0%, 62.55%)',
  'orange-a400': 'hsl(34, 100.0%, 50.0%)',
  'orange-a700': 'hsl(25, 100.0%, 50.0%)',

  'deep-orange-50': 'hsl(5, 71.43%, 94.51%)',
  'deep-orange-100': 'hsl(14, 100.0%, 86.86%)',
  'deep-orange-200': 'hsl(14, 100.0%, 78.43%)',
  'deep-orange-300': 'hsl(14, 100.0%, 69.8%)',
  'deep-orange-400': 'hsl(14, 100.0%, 63.14%)',
  'deep-orange-500': 'hsl(14, 100.0%, 56.67%)',
  'deep-orange-600': 'hsl(14, 90.68%, 53.73%)',
  'deep-orange-700': 'hsl(14, 80.39%, 50.0%)',
  'deep-orange-800': 'hsl(14, 82.28%, 46.47%)',
  'deep-orange-900': 'hsl(14, 88.18%, 39.8%)',
  'deep-orange-a100': 'hsl(14, 100.0%, 75.1%)',
  'deep-orange-a200': 'hsl(14, 100.0%, 62.55%)',
  'deep-orange-a400': 'hsl(14, 100.0%, 50.0%)',
  'deep-orange-a700': 'hsl(11, 100.0%, 43.33%)',

  'brown-50': 'hsl(19, 15.79%, 92.55%)',
  'brown-100': 'hsl(16, 15.79%, 81.37%)',
  'brown-200': 'hsl(14, 15.19%, 69.02%)',
  'brown-300': 'hsl(15, 15.32%, 56.47%)',
  'brown-400': 'hsl(15, 17.5%, 47.06%)',
  'brown-500': 'hsl(15, 25.39%, 37.84%)',
  'brown-600': 'hsl(15, 25.29%, 34.12%)',
  'brown-700': 'hsl(14, 25.68%, 29.02%)',
  'brown-800': 'hsl(11, 25.81%, 24.31%)',
  'brown-900': 'hsl(8, 27.84%, 19.02%)',

  'gray-50': 'hsl(0, 0.0%, 98.04%)',
  'gray-100': 'hsl(0, 0.0%, 96.08%)',
  'gray-200': 'hsl(0, 0.0%, 93.33%)',
  'gray-300': 'hsl(0, 0.0%, 87.84%)',
  'gray-400': 'hsl(0, 0.0%, 74.12%)',
  'gray-500': 'hsl(0, 0.0%, 61.96%)',
  'gray-600': 'hsl(0, 0.0%, 45.88%)',
  'gray-700': 'hsl(0, 0.0%, 38.04%)',
  'gray-800': 'hsl(0, 0.0%, 25.88%)',
  'gray-900': 'hsl(0, 0.0%, 12.94%)',

  'blue-gray-50': 'hsl(204, 15.15%, 93.53%)',
  'blue-gray-100': 'hsl(198, 15.66%, 83.73%)',
  'blue-gray-200': 'hsl(199, 15.33%, 73.14%)',
  'blue-gray-300': 'hsl(199, 15.63%, 62.35%)',
  'blue-gray-400': 'hsl(200, 15.38%, 54.12%)',
  'blue-gray-500': 'hsl(199, 18.3%, 46.08%)',
  'blue-gray-600': 'hsl(198, 18.45%, 40.39%)',
  'blue-gray-700': 'hsl(199, 18.34%, 33.14%)',
  'blue-gray-800': 'hsl(199, 17.91%, 26.27%)',
  'blue-gray-900': 'hsl(199, 19.15%, 18.43%)',
  'blue-gray-1000': 'hsl(199, 20.93%, 8.43%)'
};

export const config = {
  debug: true,
  colors,
  layout,
  time,
  customColors,
  urls
};
