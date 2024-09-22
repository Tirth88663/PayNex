"use client"

import { sidebarLinks } from '@/constants'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const Sidebar = ({user}: SiderbarProps) => {
    const pathName = usePathname();
  return (
    <section className='sidebar'>
        <nav className='flex flex-col gap-4'>
            <Link href="/" className='mb-12 flex cursor-pointer items-center gap-2'>
                <Image
                    src='/icons/logo.svg'
                    width={34}
                    height={34}
                    alt='Horizon Logo'
                    className='size-[24px] max-xl:size-14'
                />
                <h1 className='sidebar-logo'>PayNex</h1>
            </Link>
            {sidebarLinks.map((item) => {
                const isActive = pathName === item.route || pathName.startsWith(`${item.route}/`)
                return (
                    <Link 
                        href={item.route} 
                        key={item.label} 
                        className={cn('flex gap-3 items-center py-1 md:p-3 2xl:p-4 rounded-lg justify-center xl:justify-start', 
                            {'bg-bank-gradient': isActive})}
                    >
                        <div className='relative size-6'>
                            <Image
                                src={item.imgURL}
                                alt={item.label}
                                fill
                                className={cn({'brightness-[3] invert-0' : isActive
                                })}
                            />
                        </div>
                        <p className={cn('text-16 font-semibold text-black-2 max-xl:hidden', {
                            '!text-white' : isActive
                        })}>
                            {item.label}
                        </p>
                    </Link>
                )
            })}
            USER
        </nav>
        FOOTER
    </section>
  )
}

export default Sidebar