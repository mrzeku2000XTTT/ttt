import { useQuery } from '@tanstack/react-query';
import acaClient from '@/lib/aca/client';
export default function useWorkspace(computerId, view) {
  const workspace = useQuery({queryKey:['aca-workspace',computerId],enabled:!!computerId,queryFn:()=>acaClient('acaWorkspace',{computer_id:computerId}),refetchInterval:15000});
  const revisionId=view?.draftRevisionId || view?.revisionId;
  const file=useQuery({queryKey:['aca-file',computerId,view?.fileId,revisionId],enabled:!!computerId && !!view?.fileId && !!revisionId,queryFn:()=>acaClient('acaWorkspace',{computer_id:computerId,mode:'read',file_id:view.fileId,revision_id:revisionId})});
  return {data:workspace.data || {files:[],artifacts:[],notes:[],skills:[],verifications:[]},file:file.data,fileLoading:file.isFetching,fileError:file.error?.message,loading:workspace.isLoading,error:workspace.error?.message};
}