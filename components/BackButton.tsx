'use client'
import { NextPage } from 'next'
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons-pro/core-duotone-standard';
interface Props { }

const BackButton: NextPage<Props> = ({ }) => {
    return <div className='w-25 p-2 rounded-full flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:underline bg-muted/60' onClick={() => window.history.back()}  >

        <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color={"#ffd429ff"}
            strokeWidth={1.5}
        />
        volver

    </div>
}

export default BackButton