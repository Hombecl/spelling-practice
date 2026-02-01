'use client';

interface WordDisplayProps {
  word: string;
  revealedLetters: boolean[];
  userInput?: string[];
  mode: 'choose' | 'fill' | 'spell';
  currentIndex?: number;
  incorrectIndex?: number;
}

export default function WordDisplay({
  word,
  revealedLetters,
  userInput = [],
  mode,
  currentIndex = 0,
  incorrectIndex = -1,
}: WordDisplayProps) {
  const letters = word.split('');

  return (
    <div className="flex gap-2 sm:gap-4 justify-center items-center flex-wrap">
      {letters.map((letter, index) => {
        const isRevealed = revealedLetters[index];
        const hasUserInput = userInput[index] !== undefined;
        const isCurrent = index === currentIndex;
        const isIncorrect = index === incorrectIndex;

        // Determine what to show
        let displayLetter = '';
        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-800';
        let borderColor = 'border-gray-300';
        let animation = '';

        if (mode === 'choose') {
          // In choose mode, show letters as they're selected
          if (isRevealed || hasUserInput) {
            displayLetter = letter.toUpperCase();
            bgColor = 'bg-green-100';
            borderColor = 'border-green-400';
          }
        } else if (mode === 'fill') {
          // In fill mode, some letters are pre-shown
          if (isRevealed) {
            displayLetter = letter.toUpperCase();
            bgColor = 'bg-blue-100';
            borderColor = 'border-blue-300';
          } else if (hasUserInput) {
            displayLetter = userInput[index].toUpperCase();
            if (userInput[index].toLowerCase() === letter.toLowerCase()) {
              bgColor = 'bg-green-100';
              borderColor = 'border-green-400';
            } else {
              bgColor = 'bg-red-100';
              borderColor = 'border-red-400';
              animation = 'animate-shake';
            }
          }
        } else {
          // In spell mode, show user input or revealed letters (from peek skill)
          if (isRevealed) {
            // Letter revealed by peek skill
            displayLetter = letter.toUpperCase();
            bgColor = 'bg-purple-100';
            borderColor = 'border-purple-400';
            textColor = 'text-purple-700';
          } else if (hasUserInput) {
            displayLetter = userInput[index].toUpperCase();
            if (userInput[index].toLowerCase() === letter.toLowerCase()) {
              bgColor = 'bg-green-100';
              borderColor = 'border-green-400';
            } else {
              bgColor = 'bg-red-100';
              borderColor = 'border-red-400';
              animation = 'animate-shake';
            }
          }
        }

        if (isCurrent && !hasUserInput) {
          borderColor = 'border-blue-500';
          bgColor = 'bg-blue-50';
          animation = 'animate-pulse';
        }

        if (isIncorrect) {
          animation = 'animate-shake';
        }

        return (
          <div
            key={index}
            className={`
              w-14 h-16 sm:w-16 sm:h-20
              ${bgColor}
              border-4 ${borderColor}
              rounded-xl
              flex items-center justify-center
              text-3xl sm:text-4xl font-bold
              ${textColor}
              shadow-md
              transition-all duration-200
              ${animation}
            `}
          >
            {displayLetter || (
              <span className="text-gray-300">_</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
