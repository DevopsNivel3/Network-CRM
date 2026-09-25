<script setup lang="ts">
const lead = useLead();

const comments = computed(() => lead.comments.data.data ?? []);

const handleSend = async (content: string, anexos: any[] = []) => {
    if (!lead.data?.id) return false;
    return await lead.sendComment(lead.data.id, content, anexos);
};

const handleEdit = async (id: number, content: string, anexos: any[] = []) => {
    if (!lead.data?.id) return false;
    return await lead.editComment(lead.data.id, id, content, anexos);
};

const handleDelete = async (id: number) => {
    if (!lead.data?.id) return false;
    return await lead.deleteComment(lead.data.id, id);
};

const handleLoadMore = async () => {
    if (!lead.data?.id) return;
    await lead.loadMoreComments(lead.data.id);
};
</script>

<template>
    <ElScrollbar class="!relative !h-full !w-full">
        <div class="p-4 flex flex-col gap-2 h-full">
            <UICommentArea
                v-if="!lead.comments.isLoading"
                :comments="comments"
                :is-submitting="lead.isSubmitting"
                :is-loading="lead.comments.isLoading"
                :has-more="lead.hasMoreComments"
                :on-send="handleSend"
                :on-edit="handleEdit"
                :on-delete="handleDelete"
                :on-load-more="handleLoadMore"
            />
            <UILoadingOverlay v-if="lead.comments.isLoading" />
        </div>
    </ElScrollbar>
</template>
