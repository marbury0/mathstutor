'use client';

import { useState } from 'react';
import { createUser } from '@/app/actions/user';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState(9);
  const [yearGroup, setYearGroup] = useState(5);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [currentHobby, setCurrentHobby] = useState('');
  const [pets, setPets] = useState<{ name: string; type: string }[]>([]);
  const [currentPetName, setCurrentPetName] = useState('');
  const [currentPetType, setCurrentPetType] = useState('Dog');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addHobby = () => {
    if (currentHobby.trim()) {
      setHobbies([...hobbies, currentHobby.trim()]);
      setCurrentHobby('');
    }
  };

  const addPet = () => {
    if (currentPetName.trim() && currentPetType.trim()) {
      setPets([...pets, { name: currentPetName.trim(), type: currentPetType.trim() }]);
      setCurrentPetName('');
    }
  };

  const handleFinish = async (startingDifficulty: number) => {
    console.log('handleFinish called with difficulty:', startingDifficulty);
    setIsSubmitting(true);
    try {
      await createUser({ name, age, yearGroup, hobbies, pets, startingDifficulty });
      console.log('handleFinish success');
    } catch (error) {
      console.error('Failed to save user:', error);
      setIsSubmitting(false);
      alert('Oops! Something went wrong while saving your profile. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white/95 text-slate-900 rounded-3xl shadow-xl border-4 border-teal-300">
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-teal-800 text-center">Hi there! 👋</h2>
          <p className="text-xl text-slate-700 text-center">I'm your new Maths Tutor. What's your name?</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 text-xl border-2 border-teal-200 rounded-xl focus:border-teal-400 outline-none text-slate-900 bg-white"
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
            className="w-full bg-teal-500 hover:bg-teal-600 hover:scale-[1.02] active:scale-95 text-white font-bold py-4 rounded-xl text-xl transition-all cursor-pointer shadow-md"
          >
            Next! 🚀
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-orange-700 text-center">Cool name, {name}! 🎓</h2>
          
          <div className="space-y-2">
            <p className="text-xl text-slate-700 font-bold text-center">How old are you?</p>
            <div className="grid grid-cols-4 gap-2">
              {[5, 6, 7, 8, 9, 10, 11, 12].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setAge(a);
                    setYearGroup(Math.max(1, Math.min(6, a - 4)));
                  }}
                  className={`p-4 text-xl font-bold rounded-xl border-2 transition-all cursor-pointer ${
                    age === a
                      ? 'bg-orange-500 text-white border-orange-600 scale-105 shadow-md'
                      : 'bg-white text-slate-700 border-orange-100 hover:border-orange-300 hover:scale-[1.02]'
                  }`}
                >
                  {a === 12 ? '12+' : a}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xl text-slate-700 font-bold text-center">Which year are you in at school?</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYearGroup(y)}
                  className={`p-3 text-lg font-bold rounded-xl border-2 transition-all cursor-pointer ${
                    yearGroup === y
                      ? 'bg-teal-500 text-white border-teal-600 scale-105 shadow-md'
                      : 'bg-white text-slate-700 border-teal-50 hover:border-teal-200 hover:scale-[1.02]'
                  }`}
                >
                  Year {y}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 text-slate-800 font-bold py-4 rounded-xl text-lg cursor-pointer hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 hover:scale-[1.02] active:scale-95 text-white font-bold py-4 rounded-xl text-lg transition-all cursor-pointer shadow-md"
            >
              Next! ➡️
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-purple-700 text-center">Awesome! 🌟</h2>
          <p className="text-xl text-slate-700 text-center">What do you love doing? (Hobbies, games...)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentHobby}
              onChange={(e) => setCurrentHobby(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addHobby()}
              className="flex-1 p-4 text-lg border-2 border-purple-200 rounded-xl focus:border-purple-500 outline-none text-slate-900 bg-white"
              placeholder="e.g. Minecraft, Football..."
            />
            <button
              onClick={addHobby}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {hobbies.map((h, i) => (
              <span key={i} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold">
                {h}
              </span>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-200 text-slate-800 font-bold py-4 rounded-xl text-lg cursor-pointer hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 bg-purple-500 hover:bg-purple-600 hover:scale-[1.02] active:scale-95 text-white font-bold py-4 rounded-xl text-lg transition-all cursor-pointer shadow-md"
            >
              Almost done! ➡️
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-green-700 text-center">One last thing! 🐾</h2>
          <p className="text-xl text-slate-700 text-center">Do you have any pets? What are they?</p>
          <div className="space-y-3">
            <input
              type="text"
              value={currentPetName}
              onChange={(e) => setCurrentPetName(e.target.value)}
              className="w-full p-4 text-lg border-2 border-green-200 rounded-xl focus:border-green-500 outline-none text-slate-900 bg-white"
              placeholder="Pet's name (e.g. Fluffy)"
            />
            <div className="flex gap-2">
              <select
                value={currentPetType}
                onChange={(e) => setCurrentPetType(e.target.value)}
                className="flex-1 p-4 text-lg border-2 border-green-200 rounded-xl focus:border-green-500 outline-none text-slate-900 bg-white appearance-none"
              >
                {['Dog', 'Cat', 'Hamster', 'Rabbit', 'Fish', 'Dragon', 'Horse', 'Chicken'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button
                onClick={addPet}
                className="bg-green-500 hover:bg-green-600 text-white px-8 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Add
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {pets.map((p, i) => (
              <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">
                {p.name} ({p.type})
              </span>
            ))}
          </div>
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-gray-200 text-slate-800 font-bold py-4 rounded-xl text-lg cursor-pointer hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex-1 bg-green-500 hover:bg-green-600 hover:scale-[1.02] active:scale-95 text-white font-bold py-4 rounded-xl text-lg transition-all cursor-pointer shadow-md"
            >
              Next! ➡️
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-red-600 text-center">Ready to learn! 🎒</h2>
          <p className="text-xl text-slate-700 text-center font-medium">How do you feel about maths?</p>
          
          {isSubmitting ? (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="animate-bounce text-5xl">🤔</div>
              <p className="font-bold text-teal-700 animate-pulse text-lg">Setting up your maths dashboard...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "I need a bit of help! 🆘", diff: 1, color: "border-red-200 hover:border-red-500 text-red-700 hover:bg-red-50" },
                { label: "I do okay! 👍", diff: 3, color: "border-blue-200 hover:border-blue-500 text-blue-700 hover:bg-blue-50" },
                { label: "I'm a maths wizard! 🧙‍♂️", diff: 5, color: "border-green-200 hover:border-green-600 text-green-800 hover:bg-green-50" }
              ].map(opt => (
                <button 
                  key={opt.diff} 
                  onClick={() => handleFinish(opt.diff)}
                  className={`w-full p-4 text-lg font-bold rounded-xl border-2 transition-all bg-white text-left ${opt.color} hover:scale-[1.02] active:scale-98 cursor-pointer shadow-sm`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {!isSubmitting && (
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep(4)}
                className="w-full bg-gray-200 text-slate-800 font-bold py-4 rounded-xl text-lg cursor-pointer hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
