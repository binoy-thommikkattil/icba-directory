'use client';
import { useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';

const statementOfFaith = [
  {
    title: "God",
    text: "We believe in one Almighty God, eternally existing in three Persons—Father, Son, and Holy Spirit—co-equal, co-eternal, and of the same essence.",
    verses: "Deuteronomy 6:4; Matthew 28:19; 2 Corinthians 13:14"
  },
  {
    title: "The Bible",
    text: "We believe that the Bible is the inspired Word of God. It is the one true, infallible, and final authority in all matters of faith and practice. The Bible consists of sixty-six books written by men of God, guided by the Holy Spirit. It is equally inspired in all parts, completely inerrant in the original documents, and infallible.",
    verses: "2 Timothy 3:16; Hebrews 4:12; 2 Peter 1:20–21; 1 Thessalonians 2:13"
  },
  {
    title: "Man",
    text: "We believe that man was created by God in His image, but lost his perfect nature through sin at the fall in the Garden of Eden, and is therefore spiritually dead and separated from God, utterly unable to save himself from eternal punishment by his own works.",
    verses: "Genesis 3; Romans 3:23; Ephesians 2:8–9"
  },
  {
    title: "Lord Jesus Christ",
    text: "We believe in the eternal deity of the Lord Jesus Christ, that He is God who became man, yet without sin, born into this world through the virgin birth for the purpose of redeeming us from our sins. His atoning death and resurrection are the only means by which we may attain salvation.\n\nWe believe in the finished work of Christ on the cross of Calvary. Through His substitutionary sacrifice, Christ has effected complete and eternal redemption for all who believe on Him. God set His seal of approval on the work of Christ by raising Him from the dead. He bodily ascended into heaven, where God enthroned Him at His own right hand, where He now intercedes for believers and is preparing a glorious, eternal home for them.",
    verses: "John 1:1, 14; Philippians 2:6–8; 1 John 4:9–10 | Romans 5:8–11; 1 Corinthians 15:3–4; John 14:2; Romans 8:34"
  },
  {
    title: "Salvation",
    text: "We believe in the immediate and eternal salvation by grace through faith, apart from works, for every person who believes that the Lord Jesus Christ’s substitutionary sacrifice is the only righteous ground on which a holy God can forgive sins, and that this salvation is received through repentance toward God and faith in the Lord Jesus Christ.",
    verses: "Romans 3:23–26; 6:23; Ephesians 2:8–9"
  },
  {
    title: "Security",
    text: "We believe that all those who are thus saved are kept by God’s power and are secure in Christ forever, not because of their own merit, but because of God’s preserving grace.",
    verses: "John 5:24; 6:37, 40; 10:27–30; Romans 5:9–10; 8:1, 31, 39; 1 Corinthians 1:4, 8; Ephesians 4:30; Hebrews 7:25; 13:5; 1 Peter 1:5; Jude 24"
  },
  {
    title: "Church",
    text: "We believe that all those who have been born again through personal faith in the Lord Jesus Christ are indwelt and sealed by the Holy Spirit. We understand from the Scriptures that the true Church is not an organization but a living organism made up of all born-again believers. Scripture identifies all believers as priests who are to worship and serve God under their risen Head, the Lord Jesus Christ.\n\nWe also believe in the importance of the local church as a gathering of believers for worship, teaching, fellowship, prayer, and the breaking of bread.",
    verses: "Ephesians 1:20–23; Colossians 1:18; 1 Peter 1:18–23; 2:4–5"
  },
  {
    title: "Ordinances",
    text: "We believe and observe the two ordinances given by the Lord Jesus Christ for His church:\n\n• Baptism by immersion for all those who are born again in Christ\n• The Lord’s Supper\n\nThese ordinances are symbolic and do not impart saving grace.",
    verses: "Matthew 28:18–20; Acts 8:35–38; 1 Corinthians 11:23–25"
  },
  {
    title: "The Gospel",
    text: "We believe and proclaim the Gospel (good news) of Jesus Christ—the death, burial, and resurrection of the Lord Jesus Christ—as the only way for individuals to be reconciled to God and to be saved from their sins. It is the responsibility of every believer to be ready to declare God’s love for humankind and the message of salvation, including the atoning death, resurrection, and imminent return of the Lord Jesus Christ.",
    verses: "Matthew 28:19–20; 1 Peter 3:15; 2 Corinthians 5:20; Mark 16:15"
  },
  {
    title: "The Future",
    text: "We believe in the personal, imminent, pre-tribulational, and pre-millennial return of the Lord Jesus Christ in the air to rapture (catch up) His Church. At that time, the dead in Christ shall be raised, and those who are alive in Christ shall be caught up together with them to meet the Lord in the air, receiving immortal and incorruptible bodies, and so shall they ever be with the Lord.\n\nWe believe in the bodily resurrection of both the just and the unjust, the everlasting blessedness of the saved, and the everlasting conscious punishment of the lost.\n\nWe believe in the revelation of Christ in glory at His second advent to establish His kingdom on earth and to reign in righteousness forever and ever.",
    verses: "1 Thessalonians 4:13–17; 1 Corinthians 15:51–54; Revelation 20:11–15; Philippians 2:9–11; 2 Thessalonians 1:6–10"
  }
];

export default function StatementOfFaithPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">Our Statement of Faith</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            The foundational beliefs and scriptural truths that guide our assembly, our worship, and our daily lives.
          </p>
        </div>

        {/* Accordion Container */}
        <div className="space-y-4">
          {statementOfFaith.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div 
                key={index} 
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
                  isOpen ? 'border-teal-300 ring-1 ring-teal-100' : 'border-slate-200'
                }`}
              >
                {/* Clickable Header */}
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <h2 className={`text-xl font-bold font-serif transition-colors ${isOpen ? 'text-teal-700' : 'text-slate-800'}`}>
                    {item.title}
                  </h2>
                  <div className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'bg-teal-50 text-teal-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                    <ChevronDown size={20} />
                  </div>
                </button>

                {/* Expanding Content Area */}
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 pt-0 border-t border-slate-50 mt-2">
                    {/* The Main Belief Text */}
                    <div className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-6">
                      {item.text}
                    </div>
                    
                    {/* The Bible Verses (Styled as a distinct footer) */}
                    <div className="flex items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <BookOpen size={18} className="text-teal-600 mr-3 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scriptural Foundation</span>
                        <p className="text-sm font-medium text-slate-700 italic">
                          {item.verses}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}