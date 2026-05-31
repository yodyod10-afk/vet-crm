import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & VariantProps<typeof buttonVariants>

export function ButtonLink({ className, variant, size, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  )
}
