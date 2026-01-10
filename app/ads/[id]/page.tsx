import { GetAdvertisementById } from '@/actions/advertisements/GetAdversitingById';
import { NextPage } from 'next'
import AdsCard from '../components/AdsCard';

interface PageProps {
    params: {
        id: string;
    };
}

const Page: NextPage<PageProps> = async ({ params }) => {

    const { id } = await params;
    const { data } = await GetAdvertisementById(id);

    return <div>
        <AdsCard ad={data} />
    </div>
}

export default Page