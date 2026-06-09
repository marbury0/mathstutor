'use client';

import { useState } from 'react';
import { createUser } from '@/app/actions/user';
import { seedTopics } from '@/app/actions/seed';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [yearGroup, setYearGroup] = useState(5);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [currentHobby, setCurrentHobby] = useState('');
  const [petNames, setPetNames] = useState<string[]>([]);
  const [currentPet, setCurrentPet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addHobby = () => {
    if (currentHobby.trim()) {
      setHobbies([...hobbies, currentHobby.trim()]);
      setCurrentHobby('');
    }
  };

  const addPet = () => {
    if (currentPet.trim()) {
      setPetNames([...petNames, currentPet.trim()]);
      setCurrentPet('');
    }
  };

  const handleFinish = async () => {
    console.log('handleFinish called');
    setIsSubmitting(true);
    try {
      await seedTopics();
      await createUser({ name, yearGroup, hobbies, petNames });
      console.log('handleFinish success');
    } catch (error) {
      console.error('Failed to save user:', error);
      setIsSubmitting(false);
      alert('Oops! Something went wrong while saving your profile. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border-4 border-blue-400">
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-blue-600 text-center text-black">Hi there! 👋</h2>
          <p className="text-xl text-gray-700 text-center text-black">I'm your new Maths Tutor. What's your name?</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 text-xl border-2 border-blue-200 rounded-xl focus:border-blue-500 outline-none text-black bg-white"
            placeholder="Your name..."
            autoFocus
          />
          <button
            onClick={() => {
              if (name.trim()) {
                setStep(2);
              } else {
                alert('Please type your name first! 😊');
              }
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl text-xl transition-colors cursor-pointer"
          >
            Next! 🚀
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-orange-600 text-center text-black">Cool name, {name}! 🎓</h2>
          <p className="text-xl text-gray-700 text-center text-black">Which year are you in at school?</p>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((year) => (
              <button
                key={year}
                onClick={() => setYearGroup(year)}
                className={`p-4 text-xl font-bold rounded-xl border-2 transition-all ${
                  yearGroup === year
                    ? 'bg-orange-500 text-white border-orange-600 scale-105 shadow-md'
                    : 'bg-white text-gray-600 border-orange-100 hover:border-orange-300'
                }`}
              >
                Year {year}
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 text-gray-700 font-bold py-4 rounded-xl text-lg cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl text-lg transition-colors cursor-pointer"
            >
              Next! ➡️
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-purple-600 text-center text-black">Awesome! 🌟</h2>
          <p className="text-xl text-gray-700 text-center text-black">What do you love doing? (Hobbies, games...)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentHobby}
              onChange={(e) => setCurrentHobby(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addHobby()}
              className="flex-1 p-4 text-lg border-2 border-purple-200 rounded-xl focus:border-purple-500 outline-none text-black bg-white"
              placeholder="e.g. Minecraft, Football..."
            />
            <button
              onClick={addHobby}
              className="bg-purple-500 text-white px-6 rounded-xl font-bold cursor-pointer"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {hobbies.map((h, i) => (
              <span key={i} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                {h}
              </span>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-200 text-gray-700 font-bold py-4 rounded-xl text-lg cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 rounded-xl text-lg transition-colors cursor-pointer"
            >
              Almost done! ➡️
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-green-600 text-center text-black">One last thing! 🐾</h2>
          <p className="text-xl text-gray-700 text-center text-black">Do you have any pets? What are their names?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentPet}
              onChange={(e) => setCurrentPet(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPet()}
              className="flex-1 p-4 text-lg border-2 border-green-200 rounded-xl focus:border-green-500 outline-none text-black bg-white"
              placeholder="e.g. Fluffy, Rover..."
            />
            <button
              onClick={addPet}
              className="bg-green-500 text-white px-6 rounded-xl font-bold cursor-pointer"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {petNames.map((p, i) => (
              <span key={i} className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                {p}
              </span>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-gray-200 text-gray-700 font-bold py-4 rounded-xl text-lg cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : "Let's start! ✨"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
