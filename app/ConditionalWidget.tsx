'use client';

import { usePathname } from 'next/navigation';
import ChatWidget from '../components/ChatWidget';

export function ConditionalWidget() {
  const pathname = usePathname();
  
  // No mostrar widget en la página embed
  if (pathname === '/embed') return null;
  
  return <ChatWidget />;
}