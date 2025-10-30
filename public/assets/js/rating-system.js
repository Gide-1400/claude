/**
 * نظام التقييمات - Rating System
 * يتيح للمستخدمين تقييم بعضهم البعض بعد إكمال التوصيل
 */

// التحقق من إمكانية تقييم المطابقة
async function canRateMatch(matchId) {
    try {
        const user = JSON.parse(localStorage.getItem('fastship_user') || sessionStorage.getItem('fastship_user'));
        
        if (!user) {
            console.error('User not authenticated');
            return false;
        }

        // التحقق من حالة المطابقة
        const { data: match, error: matchError } = await window.supabaseClient
            .from('matches')
            .select('status')
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            console.error('Error fetching match:', matchError);
            return false;
        }

        // يجب أن تكون المطابقة مكتملة
        if (match.status !== 'completed') {
            showAlert('لا يمكن التقييم إلا بعد إكمال التوصيل', 'error');
            return false;
        }

        // التحقق من عدم وجود تقييم سابق
        const { data: existingRating, error: ratingError } = await window.supabaseClient
            .from('ratings')
            .select('id')
            .eq('match_id', matchId)
            .eq('rater_id', user.id)
            .single();

        if (existingRating) {
            showAlert('لقد قمت بتقييم هذه المطابقة مسبقاً', 'info');
            return false;
        }

        return true;

    } catch (error) {
        console.error('Error checking if can rate:', error);
        return false;
    }
}

// فتح نموذج التقييم
async function openRatingModal(matchId, ratedUserId, ratedUserName) {
    // التحقق من إمكانية التقييم
    const canRate = await canRateMatch(matchId);
    if (!canRate) return;

    // إنشاء modal
    const modalHTML = `
        <div class="rating-modal-overlay" id="ratingModal">
            <div class="rating-modal">
                <div class="rating-modal-header">
                    <h2>
                        <i class="fas fa-star"></i>
                        تقييم ${ratedUserName}
                    </h2>
                    <button class="close-modal" onclick="closeRatingModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <form id="ratingForm" class="rating-form">
                    <input type="hidden" id="matchId" value="${matchId}">
                    <input type="hidden" id="ratedUserId" value="${ratedUserId}">

                    <!-- التقييم الإجمالي -->
                    <div class="rating-section">
                        <label class="rating-label">التقييم الإجمالي <span class="required">*</span></label>
                        <div class="star-rating" id="overallRating" data-rating="0">
                            ${generateStarHTML(5, 'overall')}
                        </div>
                        <span class="rating-value" id="overallValue">0 من 5</span>
                    </div>

                    <!-- التقييمات التفصيلية -->
                    <div class="detailed-ratings">
                        <h3>التقييمات التفصيلية</h3>

                        <!-- التواصل -->
                        <div class="rating-section">
                            <label class="rating-label">
                                <i class="fas fa-comments"></i>
                                التواصل
                            </label>
                            <div class="star-rating" id="communicationRating" data-rating="0">
                                ${generateStarHTML(5, 'communication')}
                            </div>
                            <span class="rating-value" id="communicationValue">0 من 5</span>
                        </div>

                        <!-- الموثوقية -->
                        <div class="rating-section">
                            <label class="rating-label">
                                <i class="fas fa-shield-alt"></i>
                                الموثوقية
                            </label>
                            <div class="star-rating" id="reliabilityRating" data-rating="0">
                                ${generateStarHTML(5, 'reliability')}
                            </div>
                            <span class="rating-value" id="reliabilityValue">0 من 5</span>
                        </div>

                        <!-- الاحترافية -->
                        <div class="rating-section">
                            <label class="rating-label">
                                <i class="fas fa-user-tie"></i>
                                الاحترافية
                            </label>
                            <div class="star-rating" id="professionalismRating" data-rating="0">
                                ${generateStarHTML(5, 'professionalism')}
                            </div>
                            <span class="rating-value" id="professionalismValue">0 من 5</span>
                        </div>
                    </div>

                    <!-- حالة التسليم -->
                    <div class="form-group">
                        <label>حالة التسليم <span class="required">*</span></label>
                        <select id="deliveryStatus" required>
                            <option value="">اختر الحالة</option>
                            <option value="delivered">تم التسليم بنجاح</option>
                            <option value="delivered_late">تم التسليم مع تأخير</option>
                            <option value="damaged">تم التسليم مع أضرار طفيفة</option>
                            <option value="severely_damaged">أضرار كبيرة</option>
                            <option value="not_delivered">لم يتم التسليم</option>
                        </select>
                    </div>

                    <!-- التعليق -->
                    <div class="form-group">
                        <label>التعليق (اختياري)</label>
                        <textarea 
                            id="review" 
                            rows="4" 
                            placeholder="شارك تجربتك مع ${ratedUserName}..."
                            maxlength="500"
                        ></textarea>
                        <small class="char-count">0 / 500</small>
                    </div>

                    <!-- العلامات -->
                    <div class="form-group">
                        <label>العلامات (اختر كل ما ينطبق)</label>
                        <div class="tags-container">
                            <label class="tag-checkbox">
                                <input type="checkbox" name="tags" value="punctual">
                                <span><i class="fas fa-clock"></i> دقيق في المواعيد</span>
                            </label>
                            <label class="tag-checkbox">
                                <input type="checkbox" name="tags" value="friendly">
                                <span><i class="fas fa-smile"></i> ودود</span>
                            </label>
                            <label class="tag-checkbox">
                                <input type="checkbox" name="tags" value="professional">
                                <span><i class="fas fa-briefcase"></i> محترف</span>
                            </label>
                            <label class="tag-checkbox">
                                <input type="checkbox" name="tags" value="careful">
                                <span><i class="fas fa-hand-holding-heart"></i> حريص</span>
                            </label>
                            <label class="tag-checkbox">
                                <input type="checkbox" name="tags" value="responsive">
                                <span><i class="fas fa-reply"></i> سريع الاستجابة</span>
                            </label>
                            <label class="tag-checkbox">
                                <input type="checkbox" name="tags" value="flexible">
                                <span><i class="fas fa-random"></i> مرن</span>
                            </label>
                        </div>
                    </div>

                    <!-- هل توصي -->
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="wouldRecommend" checked>
                            <span>أوصي بالتعامل مع ${ratedUserName}</span>
                        </label>
                    </div>

                    <!-- أزرار الإجراءات -->
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeRatingModal()">
                            إلغاء
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-paper-plane"></i>
                            إرسال التقييم
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // إضافة modal إلى الصفحة
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // تفعيل نظام النجوم
    initializeStarRatings();

    // تفعيل عداد الأحرف
    const reviewTextarea = document.getElementById('review');
    const charCount = document.querySelector('.char-count');
    reviewTextarea.addEventListener('input', () => {
        charCount.textContent = `${reviewTextarea.value.length} / 500`;
    });

    // معالجة إرسال النموذج
    document.getElementById('ratingForm').addEventListener('submit', handleRatingSubmit);
}

// إغلاق modal التقييم
function closeRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) {
        modal.remove();
    }
}

// توليد HTML للنجوم
function generateStarHTML(count, type) {
    let html = '';
    for (let i = 1; i <= count; i++) {
        html += `<i class="star fas fa-star" data-rating="${i}" data-type="${type}"></i>`;
    }
    return html;
}

// تفعيل نظام تقييم النجوم
function initializeStarRatings() {
    const starContainers = document.querySelectorAll('.star-rating');
    
    starContainers.forEach(container => {
        const stars = container.querySelectorAll('.star');
        
        stars.forEach(star => {
            // عند التمرير
            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.dataset.rating);
                highlightStars(container, rating);
            });

            // عند النقر
            star.addEventListener('click', function() {
                const rating = parseInt(this.dataset.rating);
                const type = this.dataset.type;
                
                container.dataset.rating = rating;
                highlightStars(container, rating, true);
                
                // تحديث قيمة التقييم
                const valueElement = document.getElementById(`${type}Value`);
                if (valueElement) {
                    valueElement.textContent = `${rating} من 5`;
                }
            });
        });

        // إعادة التعيين عند مغادرة الماوس
        container.addEventListener('mouseleave', function() {
            const currentRating = parseInt(this.dataset.rating) || 0;
            highlightStars(container, currentRating, true);
        });
    });
}

// تفعيل النجوم
function highlightStars(container, rating, permanent = false) {
    const stars = container.querySelectorAll('.star');
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            star.classList.add('active');
            if (permanent) {
                star.classList.add('selected');
            }
        } else {
            star.classList.remove('active');
            if (permanent) {
                star.classList.remove('selected');
            }
        }
    });
}

// معالجة إرسال التقييم
async function handleRatingSubmit(e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('fastship_user') || sessionStorage.getItem('fastship_user'));
    
    if (!user) {
        showAlert('يجب تسجيل الدخول أولاً', 'error');
        return;
    }

    // جمع البيانات
    const matchId = document.getElementById('matchId').value;
    const ratedUserId = document.getElementById('ratedUserId').value;
    const overallRating = parseInt(document.getElementById('overallRating').dataset.rating);
    const communicationRating = parseInt(document.getElementById('communicationRating').dataset.rating);
    const reliabilityRating = parseInt(document.getElementById('reliabilityRating').dataset.rating);
    const professionalismRating = parseInt(document.getElementById('professionalismRating').dataset.rating);
    const deliveryStatus = document.getElementById('deliveryStatus').value;
    const review = document.getElementById('review').value.trim();
    const wouldRecommend = document.getElementById('wouldRecommend').checked;

    // جمع العلامات المحددة
    const selectedTags = Array.from(document.querySelectorAll('input[name="tags"]:checked'))
        .map(checkbox => checkbox.value);

    // التحقق من صحة البيانات
    if (overallRating === 0) {
        showAlert('يرجى اختيار التقييم الإجمالي', 'error');
        return;
    }

    if (!deliveryStatus) {
        showAlert('يرجى اختيار حالة التسليم', 'error');
        return;
    }

    // إعداد البيانات للإرسال
    const ratingData = {
        match_id: matchId,
        rater_id: user.id,
        rated_id: ratedUserId,
        rating: overallRating,
        communication_rating: communicationRating || null,
        reliability_rating: reliabilityRating || null,
        professionalism_rating: professionalismRating || null,
        delivery_status: deliveryStatus,
        review: review || null,
        would_recommend: wouldRecommend,
        tags: selectedTags.length > 0 ? selectedTags : null,
        is_public: true,
        is_verified: false
    };

    console.log('Submitting rating:', ratingData);

    try {
        // إرسال التقييم إلى Supabase
        const { data, error } = await window.supabaseClient
            .from('ratings')
            .insert([ratingData])
            .select();

        if (error) {
            console.error('Error submitting rating:', error);
            showAlert('حدث خطأ أثناء إرسال التقييم', 'error');
            return;
        }

        console.log('Rating submitted successfully:', data);
        showAlert('تم إرسال التقييم بنجاح! شكراً لك', 'success');
        
        // إغلاق modal
        closeRatingModal();

        // تحديث الصفحة إذا كانت صفحة المطابقات
        if (window.location.pathname.includes('matches.html')) {
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }

    } catch (error) {
        console.error('Error submitting rating:', error);
        showAlert('حدث خطأ غير متوقع', 'error');
    }
}

// عرض تقييمات المستخدم
async function displayUserRatings(userId, containerId) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    try {
        // جلب معلومات التقييم
        const { data: ratingStats, error: statsError } = await window.supabaseClient
            .rpc('get_user_average_rating', { user_id: userId });

        if (statsError) {
            console.error('Error fetching rating stats:', statsError);
            container.innerHTML = '<p class="error-message">تعذر تحميل التقييمات</p>';
            return;
        }

        const stats = ratingStats[0] || { average_rating: 0, total_ratings: 0, rating_breakdown: {} };

        // جلب التقييمات الأخيرة
        const { data: recentRatings, error: ratingsError } = await window.supabaseClient
            .rpc('get_user_recent_ratings', { user_id: userId, limit_count: 5 });

        if (ratingsError) {
            console.error('Error fetching recent ratings:', ratingsError);
        }

        // عرض التقييمات
        const ratingsHTML = `
            <div class="user-ratings-container">
                <!-- الإحصائيات -->
                <div class="rating-stats">
                    <div class="average-rating">
                        <div class="rating-number">${stats.average_rating || 0}</div>
                        <div class="rating-stars">
                            ${generateStarsDisplay(stats.average_rating || 0)}
                        </div>
                        <div class="rating-count">${stats.total_ratings || 0} تقييم</div>
                    </div>

                    ${stats.rating_breakdown ? generateRatingBreakdown(stats.rating_breakdown) : ''}
                </div>

                <!-- التقييمات الأخيرة -->
                ${recentRatings && recentRatings.length > 0 ? `
                    <div class="recent-ratings">
                        <h3>التقييمات الأخيرة</h3>
                        ${recentRatings.map(rating => generateRatingCard(rating)).join('')}
                    </div>
                ` : '<p class="no-ratings">لا توجد تقييمات بعد</p>'}
            </div>
        `;

        container.innerHTML = ratingsHTML;

    } catch (error) {
        console.error('Error displaying ratings:', error);
        container.innerHTML = '<p class="error-message">حدث خطأ أثناء تحميل التقييمات</p>';
    }
}

// توليد عرض النجوم
function generateStarsDisplay(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let html = '';

    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            html += '<i class="fas fa-star active"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            html += '<i class="fas fa-star-half-alt active"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }

    return html;
}

// توليد تفصيل التقييمات
function generateRatingBreakdown(breakdown) {
    return `
        <div class="rating-breakdown">
            ${[5, 4, 3, 2, 1].map(star => {
                const key = star === 1 ? '1_star' : `${star}_stars`;
                const count = breakdown[key] || 0;
                return `
                    <div class="breakdown-row">
                        <span>${star} نجوم</span>
                        <div class="breakdown-bar">
                            <div class="breakdown-fill" style="width: ${count > 0 ? (count / Object.values(breakdown).reduce((a, b) => a + b, 0) * 100) : 0}%"></div>
                        </div>
                        <span>${count}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// توليد بطاقة تقييم
function generateRatingCard(rating) {
    return `
        <div class="rating-card">
            <div class="rating-card-header">
                <div class="rater-info">
                    <i class="fas fa-user-circle"></i>
                    <span>${rating.rater_name}</span>
                    <span class="rater-type">(${rating.rater_type === 'carrier' ? 'ناقل' : 'شاحن'})</span>
                </div>
                <div class="rating-stars-small">
                    ${generateStarsDisplay(rating.rating)}
                </div>
            </div>
            ${rating.review ? `<p class="rating-review">${rating.review}</p>` : ''}
            ${rating.tags && rating.tags.length > 0 ? `
                <div class="rating-tags">
                    ${rating.tags.map(tag => `<span class="rating-tag">${translateTag(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="rating-date">${formatDate(rating.created_at)}</div>
        </div>
    `;
}

// ترجمة العلامات
function translateTag(tag) {
    const translations = {
        'punctual': 'دقيق في المواعيد',
        'friendly': 'ودود',
        'professional': 'محترف',
        'careful': 'حريص',
        'responsive': 'سريع الاستجابة',
        'flexible': 'مرن'
    };
    return translations[tag] || tag;
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'اليوم';
    } else if (diffDays === 1) {
        return 'أمس';
    } else if (diffDays < 7) {
        return `منذ ${diffDays} أيام`;
    } else {
        return date.toLocaleDateString('ar-SA');
    }
}

// دالة مساعدة لعرض الرسائل
function showAlert(message, type = 'info') {
    // البحث عن نظام الرسائل الموجود
    if (typeof window.showAlert === 'function') {
        window.showAlert(message, type);
        return;
    }

    // نظام رسائل بسيط
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

console.log('Rating system loaded successfully');
