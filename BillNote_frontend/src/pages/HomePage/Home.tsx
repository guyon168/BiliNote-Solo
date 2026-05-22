// import { FC, useEffect, useState } from 'react'
// import HomeLayout from '@/layouts/HomeLayout.tsx'
// import NoteForm from '@/pages/HomePage/components/NoteForm.tsx'
// import MarkdownViewer from '@/pages/HomePage/components/MarkdownViewer.tsx'
// import { useTaskStore } from '@/store/taskStore'
// import History from '@/pages/HomePage/components/History.tsx'
// import { getAllHistoryIds } from '@/services/note.ts'
// type ViewStatus = 'idle' | 'loading' | 'success' | 'failed'
// export const HomePage: FC = () => {
//   const tasks = useTaskStore(state => state.tasks)
//   const currentTaskId = useTaskStore(state => state.currentTaskId)

//   const currentTask = tasks.find(t => t.id === currentTaskId)

//   const [status, setStatus] = useState<ViewStatus>('idle')

//   const content = currentTask?.markdown || ''

//   useEffect(() => {
//     if (!currentTask) {
//       setStatus('idle')
//     } else if (currentTask.status === 'SUCCESS') {
//       setStatus('success')
//     } else if (currentTask.status === 'FAILED') {
//       setStatus('failed')
//     } else {
//       // PENDING、PARSING、DOWNLOADING、TRANSCRIBING、SUMMARIZING 等所有进行中状态
//       setStatus('loading')
//     }
//   }, [currentTask, currentTask?.status])

//   // useEffect( () => {
//   //     get_task_status('d4e87938-c066-48a0-bbd5-9bec40d53354').then(res=>{
//   //         console.log('res1',res)
//   //         setContent(res.data.result.markdown)
//   //     })
//   // }, [tasks]);
//   return (
//     <HomeLayout
//       NoteForm={<NoteForm />}
//       Preview={<MarkdownViewer status={status} />}
//       History={<History />}
//     />
//   )
// }


import { FC, useEffect, useState } from 'react'
import HomeLayout from '@/layouts/HomeLayout.tsx'
import NoteForm from '@/pages/HomePage/components/NoteForm.tsx'
import MarkdownViewer from '@/pages/HomePage/components/MarkdownViewer.tsx'
import { useTaskStore } from '@/store/taskStore'
import History from '@/pages/HomePage/components/History.tsx'
// 导入新增的接口以及原有的状态查询接口
import { get_task_status, getAllHistoryIds } from '@/services/note.ts'

type ViewStatus = 'idle' | 'loading' | 'success' | 'failed'

export const HomePage: FC = () => {
  const tasks = useTaskStore(state => state.tasks)
  const currentTaskId = useTaskStore(state => state.currentTaskId)

  const currentTask = tasks.find(t => t.id === currentTaskId)

  const [status, setStatus] = useState<ViewStatus>('idle')

  const content = currentTask?.markdown || ''

  useEffect(() => {
    if (!currentTask) {
      setStatus('idle')
    } else if (currentTask.status === 'SUCCESS') {
      setStatus('success')
    } else if (currentTask.status === 'FAILED') {
      setStatus('failed')
    } else {
      // PENDING、PARSING、DOWNLOADING、TRANSCRIBING、SUMMARIZING 等所有进行中状态
      setStatus('loading')
    }
  }, [currentTask, currentTask?.status])

  // ================= 核心修改点：强制加载后端本地数据 (终极无敌防御版) =================
  useEffect(() => {
    // 【黑科技防御 1】：拦截浏览器的 localStorage.setItem。
    // 防止 Zustand 试图把庞大的 12 篇笔记塞进缓存导致 QuotaExceededError 崩溃！
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = function(key, value) {
      if (key === 'task-storage') {
        return; // 直接丢弃！假装存成功了，我们再也不需要这破浏览器缓存了
      }
      originalSetItem.apply(this, [key, value]); // 其他正常的缓存放行
    };

    const fetchBackendHistory = async () => {
      try {
        console.log("【1】开始从后端拉取历史...");
        useTaskStore.setState({ tasks: [] });

        // 1. 获取 ID
        const res: any = await getAllHistoryIds();
        let rawIds = [];
        if (Array.isArray(res)) rawIds = res;
        else if (res?.data && Array.isArray(res.data)) rawIds = res.data;
        
        const taskIds = rawIds.filter((id: string) => !id.includes('_'));

        if (taskIds.length === 0) return;
        console.log("【4】成功提取有效 ID 列表，开始并发请求详情...", taskIds);

        // 2. 获取详情
        const historyPromises = taskIds.map((id: string) => get_task_status(id));
        const historyResults = await Promise.all(historyPromises);

        // 3. 提取与洗大数据
        const validTasks = historyResults
          .map((r: any) => r?.data?.data || r?.data || r) 
          .filter(item => item && item.status === 'SUCCESS')
          .map(item => {
             const resultData = item.result || {};
             
             // 【核心1】提取真实的后端 audio_meta（注意是下划线）
             const realAudioMeta = item.audio_meta || resultData.audio_meta || {};
             
             // 提取正文（防止数组报错）
             const mdText = Array.isArray(resultData.markdown) 
                            ? resultData.markdown.join('\n') 
                            : (resultData.markdown || '');

             // 魔法提取正文标题作为最后防线
             let extractedTitle = null;
             const titleMatch = mdText.match(/^#\s+(.+)$/m);
             if (titleMatch && titleMatch[1]) extractedTitle = titleMatch[1].trim();

             // 【核心2】四重保障获取真实标题：
             // 1. 后端 audio_meta 里的 title
             // 2. 后端 audio_meta 里的 video_id（你的数据库思路）
             // 3. 外层 resultData 的 video_id
             // 4. 正文正则提取的 extractedTitle
             const finalTitle = realAudioMeta.title 
                                || realAudioMeta.video_id 
                                || resultData.video_id 
                                || extractedTitle 
                                || `本地笔记_${item.task_id.substring(0,6)}`;

             // 【核心3】提取封面图，并在前端直接修复 8483:8483 双端口 Bug
             let finalCover = realAudioMeta.cover_url || item.cover_url || resultData.cover_url || '';
             if (finalCover) {
                 finalCover = finalCover.replace(':8483:8483', ':8483');
             }

             return {
               ...resultData, 
               id: item.task_id,
               status: item.status,
               platform: item.platform || resultData.platform || 'local',
               markdown: mdText,
               
               // ================= 完美映射 =================
               // 强行把后端的 audio_meta(下划线) 转换为前端组件需要的 audioMeta(驼峰)
               audioMeta: {
                  title: finalTitle,
                  cover_url: finalCover
               },
               // ============================================
               
               formData: item.formData || resultData.formData || { model_name: 'qwen3.6-plus' },
               config: item.config || resultData.config || { model_name: 'qwen3.6-plus' },
             };
          });

        console.log("【6】最终组装完成，写入状态库的数据:", validTasks);

        // 4. 将清洗好的坚不可摧的数据写入全局状态
        useTaskStore.setState({ tasks: validTasks });

      } catch (error) {
        console.error('【出错】加载后端本地历史失败:', error);
      }
    };

    fetchBackendHistory();

    // 【收尾】：组件卸载时恢复原状（保持代码洁癖）
    return () => {
       window.localStorage.setItem = originalSetItem;
    };
  }, []); 
  // ===================================================================
  // ===================================================================

  return (
    <HomeLayout
      NoteForm={<NoteForm />}
      Preview={<MarkdownViewer status={status} />}
      History={<History />}
    />
  )
}